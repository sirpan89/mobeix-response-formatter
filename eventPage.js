chrome.browserAction.onClicked.addListener(function(tab) {
	var viewTabUrl = chrome.extension.getURL('eventPage.html');
    chrome.tabs.create({ url: viewTabUrl });
});