Experimental streaming file server.


# Usage

To upstream a file
```sh
curl --upload-file myfile.gz streamit.jit.su/chooseApath
```

To downstream a file
```sh
curl streamit.jit.su/chooseApath > myfile.gz
```

Files are never stored on the server. When an upload attempt is made, the server waits until someone on the other end requests to download the file before beginning the upload. At which point, the file is streamed.

This service is meant to showcase the power of streams. A file can be immediately available for download as soon as it starts to be uploaded.

Even if the upload speed of the sender isn't as fast as that of the server's, the downloader will still receive the file faster this way rather than waiting for it to be fully uploaded and then begin downloading.

# License
MIT
