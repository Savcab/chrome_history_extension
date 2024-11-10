const userActions = [
    'click',
    'scroll',
    'keypress',
    'resize',
]

function userActionHandler(event) {
    try {
        chrome.runtime.sendMessage({
            type: "USERACTION",
            payload: {
                type: event.type,
                url: window.location.href,
            }
        });
        console.log("CONTENT SCRIPT: User action detected: ", event.type);
    } catch(error){
        console.error("CONTENT SCRIPT: Error in userActionHandler: ", error);
    }
}

// Add even handlers to send message to background.js whenever a user action is detected
userActions.forEach(action => {
    document.addEventListener(action, userActionHandler);
});
console.log("CONTENT SCRIPT: event listeners added");