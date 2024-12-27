$(document).ready(function () {
    // Show the modal when the "New Profile" button is clicked
    $(".new-profile-btn").click(function () {
        $("#profileModal").fadeIn();
    });

    // Hide the modal when the close button is clicked
    $(".close-btn").click(function () {
        $("#profileModal").fadeOut();
    });

    // Optional: Close the modal when clicking outside the modal content
    $(window).click(function (event) {
        if ($(event.target).is("#profileModal")) {
            $("#profileModal").fadeOut();
        }
    });

    $('.add-profile-btn').on('click', function() {
        const inputValue = $('.profile-input').val().trim();
        if (!inputValue) return;
    
        if (!$('.profile-container').length) {
            $('body').append('<div class="profile-container"></div>');
        }
    
        $('.profile-container').append(`
            <div class="profile-card">
                <div class="profile-icon">👤</div>
                <div>${inputValue}</div>
                <button class="delete-btn">×</button>
            </div>
        `);
    
        $('.profile-input').val('');
        $('#profileModal').hide();

        if ($('.profile-container').children().length!=0) {
            $('.empty-section').hide();
        }
       
    });
$(document).on('click', '.delete-btn', function() {//event delegation
   
    $(this).closest('.profile-card').remove();
    if ($('.profile-container').children().length===0) {
        $('.empty-section').show();
    }
    else {
        $('.empty-section').hide();
    }
    e.stopPropagation(); // Prevent parent container's click event
});

// Navigate to Page 2
$(document).on('click', '.profile-container', function () {
    const profileName = $('.profile-input').val().trim();
    $("#profile-page").removeClass("active");
    $("#profile-page").addClass("deactive");
    $("#trading-page").removeClass("deactive");
    $("#trading-page").addClass("active");

    $(".right-section p").html(`<i class="fas fa-user"></i> ${profileName}`);

    $("#page-style").attr("href", "style.css"); // Trading page css file
  
});


$('.btn.logout').on('click', function () {
    $("#profile-page").removeClass("deactive");
    $("#profile-page").addClass("active");
    $("#trading-page").removeClass("active");
    $("#trading-page").addClass("deactive");

    $("#page-style").attr("href", "profiles.css"); // Trading page css file
  
});


});


