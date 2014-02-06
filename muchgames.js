	$(document).ready( function() {

	function connectPusher() {

		/* Initiate connection to Pusher */
		if( !blnPusher ) {
			Pusher.channel_auth_endpoint = 'http://www.muchgames.com/x_pusher_auth.php';
			objPusher 	= new Pusher('47e76732e76da16c88a4');
			blnPusher	= true;
		}

	}

	function subscribeChannel( blnPrivate, strSubscribeChannelId ) {

		var objChannel		= null;
		var strSessionUser	= ( strSessionUserName != "" ) ? strSessionUserName : "";
		var strChannel 		= ( blnPrivate ) ? "private-muchgames-"+strSessionUser : "presence-muchgames";
		var blnSwitched		= ( strChannelId != strSubscribeChannelId ) ? true : false;

		strSubscribeChannel	= ( !blnPrivate && strChannelId != undefined && strChannelId != '' ) ? '-'+strChannelId : '';
		strSubscribeChannel	= ( strSubscribeChannelId ) ? '-'+strSubscribeChannelId : strSubscribeChannel;
		strChannel			= ( strSubscribeChannel != '' ) ? "presence-muchgames"+strSubscribeChannel : strChannel;

		objChannel 			= objPusher.subscribe( strChannel );

		if( !blnPrivate ) {
			$("input#strChannel").attr( 'class', strChannel );
			$("div.chatheading span").html( ucwords( strChannelType ) );
			$("div#chatroomsswitch").attr('class','chat'+strChannelType);
			$("div#chatmessages").attr('class','chatmessages'+strChannelType);
		}

		/* Global Presence Channel Bindings */
		if( !blnPrivate ) {

			objChannel.bind('pusher:subscription_succeeded', function( objMembers ) {
				updateusers( objMembers );
				updatemembercount( objMembers.count );
			});

			objChannel.bind('pusher:member_added', function( objMember ) {
				adduser( objMember.id, objMember.info );
				updatemembercount( 1, true );
			});

			objChannel.bind('pusher:member_removed', function( objMember ) {
				removeuser( objMember.id );
				updatemembercount( 1, false );
			});

		}

		objChannel.bind('chat_message', function( objData ) {
			if( $.inArray( objData.id, arrBlockedUsers ) === -1 ) {
				prependmessage( objData );
			}
		});

		objChannel.bind('notification', function( objData ) {
			if( $.inArray( objData.id, arrBlockedUsers ) === -1 ) {
				prependnotification( objData );
			}
		});

		/* Load Recent Chat History First time Pusher connects */
		if( !blnPrivate && !objGlobalChannel ) {
			objGlobalChannel 	= objChannel;
		} else {
			objPrivateChannel	= objChannel;
		}

	}

	function unsubscribeChannel( blnPrivate, strUnsubscribeChannelId ) {

		var strChannel 		= ( !blnPrivate ) ? "presence-muchgames" : "private-muchgames-";
		strChannel			= ( strUnsubscribeChannelId != undefined && strUnsubscribeChannelId != '' ) ? 'presence-muchgames-'+strUnsubscribeChannelId : strChannel;
		strChannel			= ( !strUnsubscribeChannelId && strChannelId ) ? strChannel+'-'+strChannelId : strChannel;

		objPusher.unsubscribe( strChannel );
	}

	var blnChatOpenSession  = '';
	var blnChatOpen			= 0;
	var blnUsersOpen		= 0;
	var blnChatrooms		= 0;
	var blnSpamSafe 		= true;
	var objChatUsers		= null;
	var arrPrivateChats		= new Array();
	var blnChatSound		= ( '' != 'false' ) ? true : false;

	var strChannelType		= 'global';
	var strChannelId		= '';
	var strGroupChannelId	= '';

	/* Open / Close Chat */
	function chat( blnIgnoreSubscribe ) {

		connectPusher();

		if( !blnChatOpen && blnChatOpenSession == '' ) {

			if( !blnIgnoreSubscribe ) {
				subscribeChannel();
			}

			$("td#gamechatfill").css({width:'290px'});
			$("div#sticky").css({width:'290px'});
			$("div#sticky div.chat").css({right:'-290px'}).animate({right:'0px'},{duration:400,complete:function(){
				$("div#chatbutton").fadeOut("fast");
				$("input.typemessageinput").focus();

				loadrecentchat( true );

			}});

			/* Disable pasting into chat input field */
			$("div#sticky input#chat_message").bind('paste', function(){return false;});

			blnChatOpen = 1;

		} else {

			unsubscribeChannel();

			$("div#sticky div.chat").animate({right:'-290px'},{duration:400,complete:function(){
				$("div#chatbutton").fadeIn("fast");
				$("div#sticky").css({width:'55px'});
				$("td#gamechatfill").css({width:'0px'});
				$(this).css({right:'-55px'});

				loadrecentchat();

			}});

			blnChatOpenSession	= '';
			blnChatOpen 		= '';

		}
	}

	/* Appends new private message by User */
	function privatemessage( intUserId, strUserName, blnNotification, blnLoadOpen ) {

		var intUserId = parseInt( intUserId );

		/* If User does not exist in private dialogues, append new private message dialogue */
		if( $.inArray( intUserId, arrPrivateChats ) == -1 ) {

			var objUserName			= $("<div />").html( strUserName ).addClass("privateuser");
			var objClosePrivate		= $("<i />").addClass("close");
			var objPrivateMessage 	= $("<div />").addClass("private").attr("id","privatechat_"+intUserId);

			/* Add click event for removing private message from chat bar */
			objClosePrivate.click( function() {
				privatechatremove( intUserId );
			});

			/* Append minimize icon, add click event when clicking on username of private message */
			objUserName.append( objClosePrivate ).click( function() {
				privatechatwindow( intUserId, strUserName );
			});

			objPrivateMessage.append( objUserName );

			$("div#chatbar").append( objPrivateMessage );

			arrPrivateChats.push( intUserId );
		}

		privatechatwindow( intUserId, strUserName, blnNotification, blnLoadOpen );

	}

	/* Open / Close */
	function privatechatwindow( intUserId, strUserName, blnNotification, blnLoadOpen ) {

		var objContent 			= $("<div />").html( '	<div id="chatsend">		<div class="chatinput">			<form action="javascript: void(0);" method="post" onsubmit="sendmessage( this )">				<input type="hidden" name="strAction" value="message" />				<input class="typemessageinput" type="text" autocomplete="off" name="strMessage" id="chat_message" maxlength="100" placeholder="Type message here" />				<input class="send" type="hidden" value="" />			</form>		</div>		<div class="chatreturn" onclick="$(this).prev().children(\':first\').submit();"></div>		<div class="chatsmilies" onclick="smilies( this )"></div>	</div>' );
		var objMessages			= $("<div />").attr("id", "chatmessages"+intUserId).addClass("chatmessages");
		var objPrivateMinimize 	= $("<div />").addClass("chatminimize").mouseover( function() { tooltip( $(this), 'Minimize' ) }).click( function() { privatemessage( intUserId, strUserName ); } );
		var objPrivateMessage 	= $("div#privatechat_"+intUserId);
		var objPrivateUser		= objPrivateMessage.find("div.privateuser");
		var objPrivateWindow 	= objPrivateMessage.find("div.privatewindow");
		var objNotification 	= objPrivateUser.find("u");

		/* Show / Hide private chat */
		if( !objPrivateUser.hasClass("privateopen") ) {

			/* If private window for current private message doesn't exist, create one */
			if( objPrivateWindow.length == 0 ) {
				objPrivateWindow = $("<div />").addClass("privatewindow");
				objContent.prepend("<input type=\"hidden\" class=\"private-muchgames-"+( strUserName.toLowerCase() )+"\" value=\""+intUserId+"\" />");
				objContent.append( objMessages );
				objPrivateWindow.append( objContent );
				objPrivateWindow.find("div#chatsend").append( objPrivateMinimize );
				objPrivateWindow.hide();
				objPrivateMessage.append( objPrivateWindow );
				objPrivateWindow.find("input#chat_message").bind('paste', function(){return false;});

				/* Bring clicked-on window to the front layer */
				objPrivateWindow.click(function(){
					var objPrivateChats 	= $("div#chatbar div.private");
					var objThisPrivateChat 	= objPrivateWindow.parents("div.private");
					objPrivateChats.css("z-index", 1 );
					objThisPrivateChat.css('z-index', 2 );
				});

				if( !blnLoadOpen ) {
					addpmuser( intUserId, strUserName );
				}

			}

			if( !blnNotification ) {

				objPrivateWindow.fadeIn("fast");
				objPrivateWindow.find("input#chat_message").focus();
				objPrivateUser.addClass("privateopen");
				objPrivateUser.removeClass("privateunread");

				/* If private message window is empty, load last 5 private messages in convo */
				if( objPrivateWindow.find("div.chatmessages").html() == "" ) {
					loadrecentprivatechat( intUserId );
				}

			}

		} else {

			if( !blnNotification ) {
				objPrivateUser.removeClass("privateopen");
				objPrivateWindow.hide();
			}

		}


	/* Sends message to server side endpoint of Pusher */
	function sendmessage( objThis ) {

		var objForm				= $( objThis );
		var objChannel			= objForm.parents("div#chatsend").prev();
		var strChannel			= objChannel.attr("class");
		var objMessage 			= objForm.find( "input#chat_message" );
		var strMessageString	= new String( objMessage.val() );
		var strMessage			= parseSmilies( strMessageString.replace(/\s{2,}/g, ' '), true );
		var strSessionUser		= ( !strSessionUserName ) ? '' : strSessionUserName;
		var intUserIdTo			= ( objChannel.val() != '' ) ? objChannel.val() : '';

		if( "" == "" && strSessionUser == "" ) {
			var objMessage = new Object;
			objMessage.id 		= '0';
			objMessage.username = 'Guest';
			objMessage.message 	= '<a class="red" href="javascript:openlogin();">Log In</a> or <a class="red" href="javascript:opensignup();">Sign Up</a> to Chat!';
			objMessage.avatar 	= 'images/avatar_Male_small.png';
			prependmessage( objMessage, false, '#fffef2' );
		} else if( strMessage != "" && strMessage != " " && blnSpamSafe ) {

			objMessage.focus().val("");

			$.ajax({
				type: "POST",
				url: "http://www.muchgames.com/x_pusher.php",
				data: 'strAction=message&strChannel='+strChannel+'&intUserIdTo='+intUserIdTo+'&strMessage='+strMessage,
				dataType: "text",
				success: function( strResponse ){

					if( strResponse == "spam") {
						showFade( false, '', 'Please do not spam and be kind to others.' );
					} else {

						/* If private message, prepend user's sent message */
						if( intUserIdTo != '' ) {
							var objData = JSON && JSON.parse( strResponse ) || $.parseJSON( strResponse );
							prependmessage( objData, false, '', true );
						}
					}

				}
		  	});

		  	blnSpamSafe = false;
			setTimeout ( function() {
				blnSpamSafe = true;
			}, 1000 );

		} else if( !blnSpamSafe ) {
			showFade( false, '', 'Please do not spam! We monitor all activity. Be kind to others.' );
		}
	}

	/* Receives message from server */
	function prependmessage( objData, blnAppend, strBackground, blnTo, intFromId ) {

		var intRandomNum	= randomint( 1, 10000 );
		var objMessage 		= $("<div />").addClass("chatmessage").hide();
		var objPhoto		= $("<img />").attr("src","http://www.muchgames.com/"+objData.avatar+"?rand="+intRandomNum);

		if( objData.id == '' ) {
			objPhoto.click(function(){ editprofilephoto(); }).mouseover(function(){ tooltip( this, 'Edit Profile Photo' ) });
		} else {
			objPhoto.click(function(){ location.href='http://www.muchgames.com/users/'+objData.username; });
		}

		var objAvatar		= $("<div />").addClass("chatavatar").append( objPhoto );
		var objText			= $("<div />").addClass("chattext");
		var objUserTime		= $("<div />").addClass("chatusertime").html( "<b class='red username_"+objData.id+"' onclick=\"privatechat( "+objData.id+", '"+objData.username+"' )\" onmouseover=\"usertip( this, "+objData.id+", '"+objData.username+"' )\">"+objData.username+"</b>" );
		var strDataMessage	= new String( objData.message );
		var txtMessage		= parseSmilies( strDataMessage.replace(/\\/g, '') );
		txtMessage			= ( !objData.to && !intFromId ) ? parseUser( txtMessage ) : txtMessage;
		var objBubble		= $("<div />").addClass("chatbubble").html( txtMessage );
		var objTime			= $("<span />").html( objData.time );
		var strSessionUser	= ( !strSessionUserName ) ? '' : strSessionUserName;
		var intUserIdFrom	= ( !objData.to ) ? ( intFromId ) ? intFromId : '' : ( blnTo ) ? objData.to : objData.id;
		var objMessages		= $("div#chatmessages"+intUserIdFrom);

		/* If message div doesn't exist, create new private message and append alert */
		if( !blnTo && objData.to != '' && objData.to != undefined && txtMessage != '' ) {
			privatemessage( objData.id, objData.username, true );
			objMessages		= $("div#chatmessages"+intUserIdFrom);
		}

		if( objData.username == '' || objData.username == strSessionUser ) {
			objBubble.addClass("mymessage");
		}

		if( strBackground ) {
			objMessage.css('background-color',strBackground);
		}

		if( objData.gameid ) {
			var objPlayingIcon = $("<u />").mouseover( function(){ tooltip( this, "Playing <b>"+objData.gamename+"</b>" ); } ).click( function(){ navigate( 'http://www.muchgames.com/games/'+objData.gamepage ) } );
			objUserTime.append( objPlayingIcon );
		}

		objUserTime.append( objTime );
		objText.append( objUserTime ).append( objBubble );
		objMessage.append( objAvatar ).append( objText );

		if( !blnAppend && txtMessage != '' ) {
			objMessages.prepend( objMessage );
		} else if( txtMessage != '' ) {
			objMessages.append( objMessage );
		}
		objMessage.slideDown("fast");
	}
