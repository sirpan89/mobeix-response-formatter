document.addEventListener('DOMContentLoaded', function() {
  	
  	//event to format the mobeix response
  	var checkPageButton = document.getElementById('format');
 	checkPageButton.addEventListener('click', function() {
    	chrome.tabs.getSelected(null, function(tab) {
     		var result = document.getElementById('output');
	 		result.innerHTML = format(document.getElementById('MobeixResponse').value);
	 		$("#copyClipboardBtn").removeClass("hide");
 		});
	}, false);

  	//event to reset the page
	$("#reset").on("click", function() {
		$("#MobeixResponse").val("");
		$("#output").html("");
		$("#copyClipboardBtn").addClass("hide");
		$("#exceptionMsg").addClass("hide");
	});

	//event to copy the output content
	var clipboard = new Clipboard('#copyClipboardBtn',{
	    target: function(trigger) {
	        return document.getElementById("result");
	    }
	});
	clipboard.on('success', function(e) {
	   e.clearSelection();
	   $("#successAlert").removeClass("alert-danger").addClass("alert-success")
	   		.html("Copied to Clipboard")
	   		.fadeIn()
			.css({top:0})
			.animate({top:110}, 800, function() {
				//callback
			});

	    setTimeout(function(){$("#successAlert").fadeOut(); }, 3000);
	});

	clipboard.on('error', function(e) {
	    $("#successAlert").removeClass("alert-success").addClass("alert-danger")
	    	.html("Failed to copy the content")
	    	.fadeIn()
			.css({top:0})
			.animate({top:110}, 800, function() {
				//callback
			});
		
		setTimeout(function(){$("#successAlert").fadeOut(); }, 3000);
	});
}, false);

//method to encode the html characters
function escapeHtml(unsafe) {
	return unsafe
		 .replace(/&/g, "&amp;")
		 .replace(/</g, "&lt;")
		 .replace(/>/g, "&gt;")
		 .replace(/"/g, "&quot;")
		 .replace(/'/g, "&#039;");
 }
 
//method to format the response
function format (input) {
	var formattedOutput = [];
	var maxKeyLength = 0;
	var tokens = input.split("~");
	var i = 0;
	var isException = false;
	var isSegmentParsed = false;
	var numberofSegments = 0;
	var unicodeChar = /u([0-9a-zA-Z]{4})/gi;
	var segmentKeys = [];

	  while (i < tokens.length) {
		 switch (i) {
			case 0:
			   var screenId = tokens[i];
			   formattedOutput.push("<ul class='list-unstyled'><li><b>Screen ID : </b> "+screenId+"</li>");
			   break;
			case 1:
			   var cache = tokens[i];
			   if (cache != null && cache != undefined && cache.indexOf("Y") > -1) {
				  formattedOutput.push("<li><b>Cacheble : </b> YES</li>");
			   } else {
				  formattedOutput.push("<li><b>Cacheble : </b>NO</li></ul>");
			   }
			   break;
			case 2:
			   var segmentsLength = tokens[i];
			   numberofSegments = parseInt(segmentsLength.replace(/~/g, ""));
			   formattedOutput.push("<li><b>Number Of Segments:</b> "+ numberofSegments+"</li></ul>");
			   break;
			case 3:
			   var segments = tokens[i];
			   var tz = segments.split(",");
			   
			   if (numberofSegments != tz.length) {
				  formattedOutput.push("Invalid number of Segments. Please recheck the number of segments." , "<br>");
				  isException = true;
			   }
			   for( var k = 0 ; k < tz.length ; k++) {
				  maxKeyLength = Math.max(maxKeyLength, tz[k].length);
				  segmentKeys.push(tz[k]);
			   }
			   break;
			default:
			   if (isSegmentParsed)
				  break;
			   var m = 1;
			   try {
				   formattedOutput.push("<table class='table'><tbody>");
				   for (var n = 0 ; n < segmentKeys.length ; n++) {
					   var key = segmentKeys[n];
					   var numberOfValues = parseInt(key.substring(0, key.indexOf("*")));
					   var values = [];
					   for (var j = 0; j < numberOfValues; j++) {
						   var value = tokens[i];
						   if (value != undefined) {
						   	//converts unicode characters to human readable string.
							value = value.replace(unicodeChar, function (match, grp) {
									return String.fromCharCode(parseInt(grp, 16)); 
							});
							value = unescape(value);
							value = value.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
							value = escapeHtml(value);
							   values.push(value);
						   }else {
								isException = true;
						   }
							i++;
					   }
					   //following iteration for adding spaces with key string - spaces required for retaining the format while copy pasting.
					   for(var keyStrLen = key.length; keyStrLen < maxKeyLength ; keyStrLen++) {
					   		 key += "&nbsp";
					   }

					   formattedOutput.push("<tr><td>" , m++ , "</td><td>" , key , "</td>");
					   var index = 1;
					   if(values.length >= 1) {
						 var showVal  = convertToCharacters(values[0]);
						 showVal = isJson(showVal) ? formatJSON(showVal) : showVal;
					   	 formattedOutput.push("<td>[", index++ , "] ", showVal , "</td></tr>");
					   }
					   else {
					   	formattedOutput.push("<td><font color='red'>NULL</font></td></tr>");
					   }
					   //following method for adding spaces - spaces required for retaining the format while copy pasting.
					   var reqFillers = gapFillers(m.toString().length, maxKeyLength);
					   for (var z = 1; z < values.length; z++) {
						   var showVal  = convertToCharacters(values[z]);
						   showVal = isJson(showVal) ? formatJSON(showVal) : showVal;
						   formattedOutput.push("<tr><td class='borderless'>"+reqFillers.firstcell+"</td><td class='borderless'>"+reqFillers.secondcell+"</td><td class='borderless'>[", index++ , "] ", showVal , "</td></tr>");
					   }
				   }
			   }
			   catch (err) {
				  isException = true;
				 alert(err.message);
			   }
			   formattedOutput.push("</tbody></table>");
			   if(isException) {
				  $("#exceptionMsg").removeClass("hide");
			   }
			   isSegmentParsed = true;
			   break;
		 }
		 if (isException) {
			break;
		 }
		 i++;
	  }
	  return formattedOutput.join("");
}

//method to convert to special characters for JSON formatter
function convertToCharacters(str) {
	return str
		 .replace(/&quot;/g, '"')
		 .replace(/&#039;/g, "'")
		 .replace(/\\{/g, "{")
		 .replace(/\\}/g, "}");
 }
 
//to check whether json or not
function isJson(str) {
    try {
       JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

//method to format the JSON
function formatJSON(rawVal) {
	var formattedVal = JSON.parse(rawVal);
	formattedVal = JSON.stringify(formattedVal, null, 4);
	formattedVal = "<span class='pretag'>"+formattedVal+"</span>";
	return formattedVal;
}

//method to fill the spaces with html space character - this will retain the spaces while copy pasting.
function gapFillers (firstCellStrLen, secondCellStrLen) {
	var filler = {"firstcell": "", "secondcell" : ""};
	for(var i = 0; i < firstCellStrLen; i++) {
		filler.firstcell+="&nbsp";
	}
	for(var j = 0; j < secondCellStrLen; j++) {
		filler.secondcell+="&nbsp";
	}
	return filler;
}
