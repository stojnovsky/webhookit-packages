
var http = require('http'),
	 querystring = require('querystring'),
    URL = require('url'),
	 xml2js = require('xml2js-expat');


exports.definition = {
    "name": "http",
    "category": "Sources",
    "container": {
        "icon": "/images/icons/arrow_right.png",
        "xtype": "WireIt.FormContainer",
        "title": "http",
        "fields": [
        {
            "type": "string",
            "name": "url",
            "wirable": true,
            label: "Url"
        },
        {
            "type": "select",
            "name": "method",
            "wirable": false,
            label: "Method",
            choices: ["GET", "POST", "PUT", "DELETE", "HEAD"]
        },
        {
            "type": "select",
            label: "encoding",
            "name": "encoding",
            choices: ["application/x-www-form-urlencoded", "application/json", "application/xml"]
        },
        {
            "type": "list",
            "name": "urlparams",
            listLabel: 'Parameters',
            elementType: {
                type: 'combine',
                fields: [{typeInvite: 'field'},{ typeInvite: 'value',wirable: true}],
                separators: [false, ":", false]
            }
        }
        ],
        "terminals": [
        {
            "name": "out",
            "direction": [0, 1],
            "offsetPosition": {
                "left": 86,
                "bottom": -15
            },
            "ddConfig": {
                "type": "output",
                "allowedTypes": ["input"]
            }
        }
        ]
    }
};

exports.run = function(params, cb) {
	
	console.log("HTTP params ");
	console.log(params);
	
	var url = URL.parse(params["url"]);

	var urlparams = {};
	params["urlparams"].forEach(function(p) {
		urlparams[p[0]] = p[1];
	});
	
	var port = url.port;
	if(!port) { port = 80; }
	
	var ssl = false;
	if( params["url"].substr(0,5) == "https" ) {
		ssl = true;
		port = 443;
	}
	
	var client = http.createClient(port, url.hostname, ssl);
	var path = url.pathname || '/';
	
	if(params.method == "GET" || params.method == "DELETE") {
		path += '?'+querystring.stringify(urlparams);
	}
	
	//console.log(path);
	
	var request = client.request(params.method, path, {'host': url.hostname, "content-type": params.encoding});
	
	if(params.method == "POST") {
		if(params.encoding == "application/x-www-form-urlencoded") {
			
		}	
		else if (params.encoding == "application/json") {
			
		}
	}
	
	request.end();
	request.on('response', function (response) {
	  console.log('STATUS: ' + response.statusCode);
	  console.log('HEADERS: ' + JSON.stringify(response.headers) );
	  response.setEncoding('utf8');
	  var complete = "";
	  response.on('data', function (chunk) {
		 	complete += chunk;
	  });
	  response.on('end', function () {
		
			r = complete;
			
			// content-type:
			var contentType = response.headers["content-type"].split(';')[0];
			
			if(contentType) {
				
				console.log("Content-Type "+contentType);
				
				if( contentType == "application/json" ||
					 contentType == "text/javascript" ||
					 contentType == "application/javascript") {
					r = JSON.parse(complete);
				}
			
				if(contentType == "text/xml") {
					
					var parser = new xml2js.Parser();
					parser.addListener('end', function(result) {
					    cb({out: result });
					});
			    	parser.parseString(complete);
					return;
					
				}
				
			}
		
			cb( {out: r} );
	  });
	
	});

};