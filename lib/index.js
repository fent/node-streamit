var http = require('http');
var fs = require('fs');
var path = require('path');


/**
 * Keep index file in memory.
 */
var indexFile = fs.readFileSync(path.join(__dirname, '../static/index.html'));

/**
 * Keep track of active streams.
 */
var uploads = {};
var downloads = {};


http.createServer(function onRequest(req, res) {
  switch (req.url) {
    case '/':
      onIndex(req, res);
    break;

    case '/favicon.ico':
      res.end();
      break;

    default:

      switch (req.method) {
        case 'GET':
          onGET(req, res);
          break;

        case 'PUT':
          onPUT(req, res);
          break;

        default:
          var msg = 'Request method not supported!';
          console.log(msg);
          res.end(msg + '\n');
      }
  }
}).listen(3000);


/**
 * Called when the site root is requested.
 *
 * @param (ServerRequest) req
 * @param (ServerResponse) res
 */
function onIndex(req, res) {
  if (req.headers['x-from-cli']) {

  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(indexFile);
  }
}


/**
 * Called when there is a GET request.
 *
 * @param (ServerRequest) req
 * @param (ServerResponse) res
 */
function onGET(req, res) {
  var upload = uploads[req.url];

  if (upload) {
    connect(upload, { req: req, res: res });

  } else {
    if (downloads[req.url]) {
      var msg = 'download slot already taken!';
      console.log(msg);
      res.end(msg + '\n');
    } else {
      downloads[req.url] = { req: req, res: res };
      console.log('waiting on upload', req.url);

      req.once('close', function() {
        delete downloads[req.url];
      });
    }
  }
}


/**
 * Called when there is a PUT request.
 *
 * @param (ServerRequest) req
 * @param (ServerResponse) res
 */
function onPUT(req, res) {
  var download = downloads[req.url];

  if (download) {
    connect({ req: req, res: res }, download);

  } else {
    req.pause();

    if (uploads[req.url]) {
      var msg = 'upload slot already taken!';
      console.log(msg);
      res.end(msg + '\n');
    } else {
      uploads[req.url] = { req: req, res: res };
      console.log('waiting on download', req.url);

      req.once('close', function() {
        delete uploads[req.url];
      });
    }
  }

  req.on('end', res.end.bind(res));
}


/**
 * Connect an upload stream and a download stream.
 *
 * @param (Object) upload
 * @param (Object.ServerRequest) req
 * @param (Object.ServerResponse) res
 * @param (Object) download
 * @param (Object.ServerRequest) req
 * @param (Object.ServerResponse) res
 */
function connect(upload, download) {
  var length = upload.req.headers['content-length'];
  if (length) {
    download.res.setHeader('Content-Length', length);
  }
  download.res.writeHead(200);

  upload.req.pipe(download.res);
  upload.req.resume();

  delete uploads[upload.req.url];
  delete downloads[download.req.url];

  upload.req.once('close', function() {
    download.res.end();
  });

  download.res.once('close', function() {
    upload.res.end();
  });

  console.log('streams connected', upload.req.url);
}
