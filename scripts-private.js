   // Enable pusher logging - don't include this in production
    Pusher.log = function(message) {
      if (window.console && window.console.log) {
        window.console.log(message);
      }
    };

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

      $('.join').hide();

      pusher = new Pusher('b1315db8f3b8f87e7717', { authEndpoint: 'pusher_auth.php' });
      presencechannel = pusher.subscribe('presence-chat-channel');
      var $chatBtn = $(this),
      time = new Date(),
      timeString;

      time.setDate(time.getDate());
      timeString = ('0' + time.getHours()).slice(-2) + ':' + ('0' + (time.getMinutes())).slice(-2) + ':' + ('0' + (time.getSeconds())).slice(-2)  +'.';

      pusher.connection.bind('connected',function() {

        $('.chat-btn').hide();
        $('.chat-screen').show();
        $('.message-form').show();

        $('.chat-area p').text('Chat started at ' + timeString).addClass('chat-on');

      });

      presencechannel.bind('pusher:subscription_succeeded', function(members) {
        console.log('subscribed')
      });

      presencechannel.bind('pusher:subscription_error', function(status) {
        $('body').append(status);
      });


      $('.send-btn').click( function(){
        var msg = $(this).siblings('.message-input').val(),
            username = $(this).attr('id');

        presencechannel.trigger('client-send-message', {username: username, message: msg});

      });

      presencechannel.bind('client-send-message',
        function(data) {
          console.log(data.username)
        }
      );

    });