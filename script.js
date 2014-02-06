    Pusher.log = function(message) {
      if (window.console && window.console.log) {
        window.console.log(message);
      }
    };

    pusher = new Pusher('b1315db8f3b8f87e7717');
    //Pusher.channel_auth_endpoint = 'pusher_auth.php';
    channel = pusher.subscribe('chat-channel');


    $('.close-btn').click(function(){
      $(this).parent().hide();
      $('.invite').show();
    })

    $('.chat-btn').click(function() {
      $('.join').show();
    });

    $('.reject-btn').click(function() {
      $('.join').hide();
      $('.invite').hide();
      $('.reject').show();
    });

    $('.join-btn').click(function() {
      var time = new Date(),
          timeString;
      time.setDate(time.getDate());
      timeString = ('0' + time.getHours()).slice(-2) + ':' + ('0' + (time.getMinutes())).slice(-2) + ':' + ('0' + (time.getSeconds())).slice(-2)  +'.';

      $('.join').hide();
      $('.chat-btn').hide();
      $('.chat-screen').show();
      $('.message-form').show();
      $('.chat-area p').text('Chat started at ' + timeString).addClass('chat-on');
    });

    $('.send-btn').click( function(){
      var msg = $(this).siblings('.message-input').val(),
          username = $(this).attr('id');

    });


