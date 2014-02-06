var outputEl = document.getElementById('client_event_example_log');
var state = {
  currentX: 0,
  currentY: 0,
  lastX: undefined,
  lastY: undefined
};

var pusher = new Pusher("YOUR_APP_KEY");
var channel = pusher.subscribe("private-mousemoves");

// this method should be bound as a 'mousemove' event listener
document.body.addEventListener('mousemove', onMouseMove, false);
function onMouseMove(ev){
  ev = ev || window.event;
  state.currentX = ev.pageX || ev.clientX;
  state.currentY = ev.pageY || ev.clientY;
}

setInterval(function(){
  if(state.currentX !== state.lastX || state.currentY !== state.lastY){
    state.lastX = state.currentX;
    state.lastY = state.currentY;

    var text = document.createTextNode(
      'Triggering event due to state change: x: ' + state.currentX + ', y: ' + state.currentY
    );
    outputEl.replaceChild( text, outputEl.firstChild );

    channel.trigger("client-mouse-moved", {x:state.currentX, y: state.currentY});
  }
}, 300); // send every 300 milliseconds if position has changed