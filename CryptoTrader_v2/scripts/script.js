$(document).ready(function() {
    const coinContainer = $('#coin-container');
    const selectedCoin = $('#selected-coin');
    const chartContainer = $('.chart');
    
    /*** DISPLAY DATE ***/
    let currentDay = 1; // Start at Day 2
    let fastForwardTimer = null;

    // Generate the array of dates (Day 2 is '02-01-2021')
    const dates = [];
    let startDate = new Date('2021-01-01');

    for (let i = 0; i < market.length; i++) {
        dates.push({
            day: i + 1,
            date: startDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            }),
        });
        startDate.setDate(startDate.getDate() + 1); // Increment the date by 1
    }

    function updateDateDisplay() {
        const current = dates[currentDay];
        $('#day-display').text(`Day ${current.day}`);
        $('#date-display').text(`${current.date}`);
    }


    /*** RENDER COINS ***/
    let currentCoinCode = 'btc'; // Default selected coin

    function renderCoins() {
        coins.forEach((coin, index) => {
            const coinElement = $(`
                <div class="coin" data-index="${index}" data-code="${coin.code}">
                    <img src="images/${coin.image}" alt="${coin.name}">
                </div>
            `);
            coinContainer.append(coinElement);
        });

        updateSelectedCoin(2); // Default to Bitcoin
    }

    function updateSelectedCoin(index) {
        $('.coin').removeClass('selected');
        const selected = $(`.coin[data-index="${index}"]`);
        selected.addClass('selected');
        currentCoinCode = selected.data('code');

        selectedCoin.html(`
            <img src="images/${coins[index].image}" alt="${coins[index].name}" class="selected-coin-image">
            <p>${coins[index].name}</p> 
            <div id="tooltip"></div>
        `);
    }


    


    /*** CANDLESTICK CHART ***/
    function computeScales() {
        // Calculate scale factor for each coin (to fit chart height)
        let scales = {};
        market.forEach((day) => {
            day.coins.forEach((coin) => {
                const { code, low, high } = coin;

                if (!scales[code]) {
                    scales[code] = { min: Infinity, max: -Infinity };
                }

                // Update min and max
                scales[code].min = Math.min(scales[code].min, low);
                scales[code].max = Math.max(scales[code].max, high);
            });
        });

        for (const code in scales) {
            const range = scales[code].max - scales[code].min;
            scales[code].factor = 400 / range;
        }

        return scales;
    }

    function renderCandlestick() {
        chartContainer.empty();
        const candlesticksContainer = $('<div class="candlesticks-container"></div>');
        chartContainer.append(candlesticksContainer);
    
        const scales = computeScales();
        const stickWidth = 11; // Width of each candlestick
        const maxCandlesticks = 89;
        const xOffset = Math.max(0, currentDay - maxCandlesticks + 1) * stickWidth;
    
        let minValue = Infinity;
        let maxValue = -Infinity;
        let currentClose = null;

        // Render all candlesticks up to the current day
        for (let i = 1; i <= currentDay; i++) {
            const day = market[i];
            const coinData = day.coins.find((coin) => coin.code === currentCoinCode);
    
            if (coinData) {
                const { code, open, high, low, close } = coinData;
    
                const factor = scales[code].factor;
                const min = scales[code].min;
    
                const normalizedLow = (low - min) * factor;
                const normalizedHigh = (high - min) * factor;
                const normalizedOpen = (open - min) * factor;
                const normalizedClose = (close - min) * factor;
                console.log('close', normalizedClose);

                // Update min and max values
                minValue = Math.min(minValue, low);
                maxValue = Math.max(maxValue, high);
                
                if (i === currentDay) {
                    currentClose = normalizedClose;
                }
    
                // Calculate stick and bar positions
                const stickHeight = normalizedHigh - normalizedLow;
                const barHeight = Math.abs(normalizedOpen - normalizedClose);
                const barPos = Math.min(normalizedOpen, normalizedClose);
                const color = open < close ? 'green' : 'red';
    
                const candlestick = $('<div class="candlestick"></div>').css({
                    width: `${stickWidth}px`,
                    height: '100%',
                    position: 'relative',
                    display: 'inline-block',
                });
    
                const stick = $(`<div class="stick"></div>`).css({
                    height: `${stickHeight}px`,
                    bottom: `${normalizedLow}px`,
                    position: 'absolute',
                    left: '50%', 
                    transform: 'translateX(-50%)',
                });
    
                const bar = $(`<div class="bar"></div>`)
                    .css({
                        height: `${barHeight}px`,
                        bottom: `${barPos}px`,
                        background: color,
                        left: '50%', 
                        transform: 'translateX(-50%)',
                    })
                    .data({
                        date: day.date,
                        open: open,
                        close: close,
                        high: high,
                        low: low,
                    })
                    .on('mouseenter', function () {
                        const data = $(this).data();
                        $('#tooltip').html(
                            `Date: ${data.date} Open: $${data.open} Close: $${data.close} High: $${data.high} Low: $${data.low}`
                        ).css('visibility', 'visible');
                    })
                    .on('mouseleave', function () {
                        $('#tooltip').css('visibility', 'hidden');
                    });
    
                candlestick.append(stick).append(bar);
                candlesticksContainer.append(candlestick);
            }
        }
    
        // Apply sliding effect
        candlesticksContainer.css('transform', `translateX(-${xOffset}px)`);

        // Add the max and min labels
        const maxLabel = $(`<div class="max-label">$${maxValue}</div>`);
        const minLabel = $(`<div class="min-label">$${minValue}</div>`);
        chartContainer.append(maxLabel).append(minLabel);

        // Add the close line and label
        if (currentClose !== null) {
            const closeLine = $('<div class="close-line"></div>').css({
                top: `${406 - currentClose}px`, // Invert the y-axis for positioning
            });

            const closeLabel = $(`<div class="close-label">$${market[currentDay].coins.find((coin) => coin.code === currentCoinCode).close}</div>`).css({
                top: `${406 - currentClose}px`,
            });

            chartContainer.append(closeLine).append(closeLabel);
        }
    }
    

    /*** BUTTON HANDLERS ***/
    coinContainer.on('click', '.coin', function() {
        const selectedIndex = $(this).data('index');
        updateSelectedCoin(selectedIndex);
        renderCandlestick();
    });

    $('.btn.nextDay').on('click', function () {
        if (currentDay < market.length - 1) {
            currentDay++;
            updateDateDisplay();
            renderCandlestick();
            renderWallet();
        }
    });

    $('.btn.play').on('click', function () {
        const button = $(this);
        console.log('button', button);

        if (!fastForwardTimer) {
            fastForwardTimer = setInterval(() => {
                if (currentDay < market.length - 1) {
                    currentDay++;
                    updateDateDisplay();
                    renderCandlestick();
                    renderWallet();
                } else {
                    clearInterval(fastForwardTimer); // Stop the timer when all days are displayed
                    fastForwardTimer = null;
                    button.html('<i></i>&#9654; Play');
                }
            }, 100); // 100ms interval

            button.html('<i class="fas fa-pause"></i> Pause');

        } else {
            clearInterval(fastForwardTimer);
            fastForwardTimer = null;
            button.html('<i></i>&#9654; Play');
        }
    });

    renderCoins();

    /*** SAVE USER STATE ***/
    function saveProfile(){//Saves; selected coin, current day, and puts into a dictionary

        const currentProfile=$('.right-section p').text().replace('👤 ', '').trim();
        console.log("saving currentProfile",currentProfile);

        const profile = {
            coin: currentCoinCode,
            day: currentDay,
        };

        localStorage.setItem(currentProfile, JSON.stringify(profile));


    }

    function getProfile(){//Retrieves the profile from local storage

        const currentProfile = $('.right-section p').text().replace('👤 ', '').trim();
       console.log("loading currentProfile",currentProfile);


        const profile = JSON.parse(localStorage.getItem(currentProfile));

        if(profile){
            console.log("profile",profile);
            currentCoinCode = profile.coin;
            currentDay = profile.day;

            updateSelectedCoin(coins.findIndex((coin) => coin.code === currentCoinCode));
            updateDateDisplay();
            renderCandlestick();
            renderWallet()
        }

        else{
            console.log("New profile");
            currentCoinCode = 'btc';
            currentDay = 1;

            updateSelectedCoin(coins.findIndex((coin) => coin.code === currentCoinCode));
            updateDateDisplay();
            renderCandlestick();
            renderWallet()
        }
    }

    function getWallet() {
        const currentProfile = $('.right-section p').text().replace('👤 ', '').trim();
        let wallet = JSON.parse(localStorage.getItem(`${currentProfile}_wallet`));
        if (!wallet) {
            wallet = { balance: 1000, coins: {} }; // Default starting balance
            localStorage.setItem(`${currentProfile}_wallet`, JSON.stringify(wallet));
        }
        return wallet;
    }
    
    function saveWallet(wallet) {
        const currentProfile = $('.right-section p').text().replace('👤 ', '').trim();
        localStorage.setItem(`${currentProfile}_wallet`, JSON.stringify(wallet));
    }

    function renderWallet() {
        const wallet = getWallet();
        $('#total-money').text(`$${wallet.balance.toFixed(2)}`);
        const walletTable = $('#wallet-table');
        walletTable.empty();
    
        Object.keys(wallet.coins).forEach((coin) => {
            const { amount, subtotal } = wallet.coins[coin];
            const lastClose = market[currentDay].coins.find((c) => c.code === coin).close;
            walletTable.append(`
                <tr>
                    <td>${coin.toUpperCase()}</td>
                    <td>${amount.toFixed(2)}</td>
                    <td>$${subtotal.toFixed(2)}</td>
                    <td>$${lastClose.toFixed(2)}</td>
                </tr>
            `);
        });
    }

    $('#buy-toggle').on('click', function () {
        $('#buy-toggle').addClass('active').removeClass('inactive');
        $('#sell-toggle').addClass('inactive').removeClass('active');
        $('#action-btn').text('Buy'); // Update button text
    });
    
    $('#sell-toggle').on('click', function () {
        $('#sell-toggle').addClass('active').removeClass('inactive');
        $('#buy-toggle').addClass('inactive').removeClass('active');
        $('#action-btn').text('Sell'); // Update button text
    });

    $('#amount').on('input', function () {
        const amount = parseFloat($('#amount').val()) || 0;
        const lastClose = market[currentDay].coins.find((c) => c.code === currentCoinCode).close;
        $('#transaction-value').text((amount * lastClose).toFixed(2));
    });

    $('#action-btn').on('click', function () {
        const wallet = getWallet();
        const amount = parseFloat($('#amount').val());
        const lastClose = market[currentDay].coins.find((c) => c.code === currentCoinCode).close;
        const transactionValue = amount * lastClose;
    
        if ($('#buy-toggle').hasClass('active')) {
            // Buying logic
            if (wallet.balance >= transactionValue) {
                wallet.balance -= transactionValue;
                if (!wallet.coins[currentCoinCode]) {
                    wallet.coins[currentCoinCode] = { amount: 0, subtotal: 0 };
                }
                wallet.coins[currentCoinCode].amount += amount;
                wallet.coins[currentCoinCode].subtotal += transactionValue;
                saveWallet(wallet);
                renderWallet();
            } else {
                alert('Insufficient balance to complete the transaction.');
            }
        } else {
            // Selling logic
            if (wallet.coins[currentCoinCode] && wallet.coins[currentCoinCode].amount >= amount) {
                wallet.balance += transactionValue;
                wallet.coins[currentCoinCode].amount -= amount;
                wallet.coins[currentCoinCode].subtotal -= transactionValue;
                if (wallet.coins[currentCoinCode].amount <= 0) {
                    delete wallet.coins[currentCoinCode];
                }
                saveWallet(wallet);
                renderWallet();
            } else {
                alert('Insufficient coins to sell.');
            }
        }
    });
    
    
    $('.btn.logout').on('click', function () {
        console.log("logout");
        $("#profile-page").removeClass("deactive");
        $("#profile-page").addClass("active");
        $("#trading-page").removeClass("active");
        $("#trading-page").addClass("deactive");
    
        $("#page-style").attr("href", "profiles.css"); // Trading page css file

        saveProfile();
    });

    $(document).on('click', '.profile-card', function() {
        console.log("Profile card clicked"); // Debug log
        
        const profileName = $(this).find('div:nth-child(2)').text().trim();
        
        // First, remove all classes
        $("#profile-page, #trading-page").removeClass("active deactive");
        
        // Then add the appropriate classes
        $("#profile-page").addClass("deactive");
        $("#trading-page").addClass("active");
        
        // Update profile name display
        $(".right-section p").html(`<i class="fas fa-user"></i> ${profileName}`);
        
        // Switch stylesheet
        $("#page-style").attr("href", "style.css");
        
        // Load profile data
        getProfile();
    });
});