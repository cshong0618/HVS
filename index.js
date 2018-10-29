const fs = require("fs");
const querystring = require("querystring");
const {Transform} = require("stream");
var process = require("process");

const express = require("express");
const cors = require("cors");

var ripSubtitles = require("rip-subtitles");

var app = express();

app.set("view engine", "ejs");

app.use(cors());

app.use((req, res, next) => {
    if (req.url.includes("ico")) {
        res.sendStatus(404);
    };

    next("route");
})

var host = process.env.host || "localhost";
var port = process.env.port || 5555;
var root = process.env.root || "/";

var isImage = (filename) => {
    var imageExtensions = [
        "png",
        "jpg"
    ]

    var matchCount = (imageExtensions.filter(x => filename.includes(x))).length;
    return matchCount;
}

var isImageDir = (filelist) => {
    var imageFiles = filelist.filter(x => isImage(x));
    return filelist.length === imageFiles.length;
}

var checkFile = (extensions) => (req, res, next) => {
    var checkExtension = (ext) => {
        if(!Array.isArray(extensions)) {
            extensions = [extensions];
        }

        var matchCount = (extensions.filter(x => x === ext)).length;
        return matchCount > 0;
    }

    // Strip extension
    //console.log(req.url);
    var ext = req.url.split(".").pop();
    //console.log("checkFile", ext, req.url, extensions, ext, "\n");

    if (fs.statSync(root + decodeURIComponent(req.url)).isDirectory()) {
        res.redirect("/list"+req.url);
    }
    else if(checkExtension(ext)) {
        next();
    } else {
        res.redirect("/download"+req.url);
    }
}


app.get("/download/*", (req, res) => {
    var filename = root + "/" + decodeURIComponent(req.params[0]);
    //console.log("/download/:filename ", filename);
    var rawFileName = filename.split("/").pop();

   res.sendFile(filename);
})

app.get("/vtt/*", (req, res) => {
    var filename = "/" + decodeURIComponent(req.params[0]);
    //  console.log("/vtt/ ", filename);
    
    ripSubtitles(filename, {format: "webvtt"})
        .on('error', (err) => {
            // console.error(err);
        })
        .pipe(new Transform({
            transform(chunk, encoding, callback) {
                var line = chunk.toString('utf-8')
                    .replace(/{.*?}/g, "");
                this.push(line);
                callback();
            },
        }))
        .pipe(res)
        
});

app.get("/api/*", (req, res) => {
    var filename = "/" + decodeURIComponent(req.params[0]);
    var stat = fs.statSync(filename);
    var filesize = stat.size;
    var range = req.headers.range;

    var ext = filename.split(".").pop();
    if(range) {
        var parts = range.replace("bytes=", "").split("-");
        var start = parseInt(parts[0], 10) || 0;
        var end = parseInt(parts[1], 10) || filesize - 1;
        var chunkSize = (end - start) + 1;
        var file = fs.createReadStream(filename, {start, end});
        var head = {
            'Content-Range': `bytes ${start}-${end}/${filesize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': `video/${ext}`
        }

        res.writeHead(206, head);
        file.pipe(res);
    } else {
        var head = {
            'Content-Length': filesize,
            'Content-Type': `video/${ext}`
        }
        res.writeHead(200, head);
        fs.createReadStream(filename).pipe(res);
    }
})


/*
app.get("/api/*", (req, res) => {
    var filename = "/" + decodeURIComponent(req.params[0]);
    console.log("short /api/:filename ", filename);

    fs.createReadStream(filename).pipe(res);
    //res.sendFile(filename);
});
*/

app.get("/videos", (req, res) => {
    var filelist = fs.readdirSync(root);
    res.render("pages/videolist.ejs", {filelist});
});

app.get("/manga/*", (req, res) => {
    // For directory with all images
    var rel = decodeURIComponent(req.params[0]);
    
    var path = root + "/" + rel;
    console.log("manga: ", path);
    var filelist = fs.readdirSync(path);

    filelist = filelist.map(name => "/download/" + rel + "/" + name);
    res.render("pages/manga.ejs", {filelist});
});

app.get("/list/*", (req, res) => {
    var rel = decodeURIComponent(req.params[0]);

    if(rel) rel = "/" + rel;

    var path = root + "/" + rel;
    var filelist = fs.readdirSync(path)
            
    filelist = filelist
        .filter(x => !x.includes("torrent"))
        .map(name => rel + "/" + name);
    // console.log(req.url, rel);

    if(isImageDir(filelist)) {
        res.render("pages/manga.ejs", {filelist});
    } else {
        res.render("pages/list.ejs", {filelist});
    }

});

app.get("/*", checkFile(["mkv", "mp4"]), (req, res) => {
    var rawFileName = decodeURIComponent(req.url);
    if(rawFileName[0] !== "/") "/" + rawFileName;

    filename =  "/api" + root + "/" +rawFileName;
    trackname = "/vtt" + root + "/" +rawFileName;
    
    //console.log(":filename", filename, trackname);
    
    res.render("pages/video.ejs", {filename, trackname});
});


app.get("/", (req, res) => {
    var filelist = fs.readdirSync(root);
    filelist = filelist.map(name => root + "/" + name);
    res.render("pages/index.ejs", {filelist});
});


app.listen(port, host, () => {
    console.info("Server started with");
    console.info("HOST: ", host);
    console.info("PORT: ", port);
});