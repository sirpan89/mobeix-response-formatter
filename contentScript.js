$(document).ready(function(){
		//event to reset the page
		$("#reset").on("click", function() {
			$("#MobeixResponse").val("");
			$("#output").html("");
			$("#copyClipboardBtn").addClass("hide");
			$("#exceptionMsg").addClass("hide");
		});
		
		//event to copy the output content
		$("#copyClipboardBtn").on("click", function(){
			selectElementContents( document.getElementById('result') );
			document.execCommand("copy");
			$("#successAlert").fadeIn()
				.css({top:0})
				.animate({top:110}, 800, function() {
					//callback
				});
			
			setTimeout(function(){$("#successAlert").fadeOut(); }, 3000);
		});
});

document.addEventListener('DOMContentLoaded', function() {
  var checkPageButton = document.getElementById('format');
 
	//event to call format method
  checkPageButton.addEventListener('click', function() {
	
    chrome.tabs.getSelected(null, function(tab) {
     var result = document.getElementById('output');
	 result.innerHTML = format(document.getElementById('MobeixResponse').value);
	 $("#copyClipboardBtn").removeClass("hide");
    });
  }, false);
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
	var tokens = input.split("~");
	var i = 0;
	var isException = false;
	var isSegmentParsed = false;
	var numberofSegments = 0;
	var segmentKeys = [];

	  while (i < tokens.length) {
		 switch (i) {
			case 0:
			   var screenId = tokens[i];
			   formattedOutput.push("<ul class=\"list-unstyled\"><li><b>Screen ID : </b> "+screenId+"</li>");
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
				  segmentKeys.push(tz[k]);
			   }
			   //console.log("Segments Keys prepared. Count: " + segmentKeys.length);                
			   break;
			default:
			   if (isSegmentParsed)
				  break;
			   
			   var m = 1;
			   try {
				   formattedOutput.push("<table class='table'>");
				   for (var n = 0 ; n < segmentKeys.length ; n++) {
					   var key = segmentKeys[n];
					   //console.log("Parsing segment key: " + key);
					   var numberOfValues = parseInt(key.substring(0, key.indexOf("*")));
					   var values = []
					   for (var j = 0; j < numberOfValues; j++) {
						   //console.log("tokens["+i+"]: " + tokens[i]);
						   //console.log(tokens[i].length);
						   var token = tokens[i];
						   if (token != undefined) {
							   values.push(token);
						   }else {
								isException = true;
						   }
							i++;
					   }
					   formattedOutput.push("<tr><td>" , m++ , "</td><td>" , key , "</td><td>");
					   var index = 1;
					   //console.log(values);
					   for (var z = 0; z < values.length; z++) {
						   var r = /u([\d\w]{4})/gi;
						   var value = values[z];
							value = value.replace(r, function (match, grp) {
									return String.fromCharCode(parseInt(grp, 16)); } );
							value = unescape(value);
							value = value.replace(/&lt;/g, '<').replace(/&gt;/g, '>') 
						   formattedOutput.push("<p>[", index++ , "] ", escapeHtml(value) , "</p>");
					   }
					 
					   if (values.length == 0) {
						   formattedOutput.push("<font color=\"red\">NULL</font>");
					   }
					   formattedOutput.push("</td></tr>");
				   }
			   }
			   catch (err) {
				  //formattedOutput.push("<font color=\"red\">Please check whether delimiters(~)are placed properly in segments.</font>" , "<br>");
				  isException = true;
				 console.log(err.message);
			   }
			   formattedOutput.push("</table>");
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

//method to select the content
function selectElementContents(el) {
    var body = document.body, range, sel;
    if (document.createRange && window.getSelection) {
        range = document.createRange();
        sel = window.getSelection();
        sel.removeAllRanges();
        try {
            range.selectNodeContents(el);
            sel.addRange(range);
        } catch (e) {
            range.selectNode(el);
            sel.addRange(range);
        }
    } else if (body.createTextRange) {
        range = body.createTextRange();
        range.moveToElementText(el);
        range.select();
    }
}