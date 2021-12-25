const express = require("express");
const bodyparser = require("body-parser");
const multer = require("multer");
const path = require("path");
const { exec } = require('child_process');
const fs = require('fs')

const app = express();
app.use(bodyparser.urlencoded({extended:true}))
app.use(bodyparser.json());
app.use(express.static(path.join(__dirname + "/public/uploads")));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const txtFilter = function (req, file, callback) {
  var ext = path.extname(file.originalname);
  if (
    ext !== ".txt"
  ) {
    return callback("This Extension is not supported");
  }
  callback(null, true);
};

var maxSize = 10000 * 1024 * 1024;

const upload = multer({
    storage: storage,
    fileFilter: txtFilter,
    limits:{fileSize:maxSize}
}).single('file');

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post('/uploadfile', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.send(err)
        }
        else {
            console.log(req.file.path)
            res.json({
                path:req.file.path
            })
        }
    })
})



app.post("/textfiletospeech", (req, res) => {
    output = Date.now() + "output." + req.body.format;

    console.log(req.body.path);

    console.log(req.body.format);

    var command = `ffmpeg -f lavfi -i "flite=textfile='${req.body.path}'" ${output}`;

    console.log(command);

    exec(
      command,

      (err, stdout, stderr) => {
        if (err) {
          console.log(err);
        }
        console.log(stdout);
        res.json({
          path: output,
        });
      }
    );
});

app.get("/download", (req, res) => {
  var pathoutput = req.query.path;
  console.log(pathoutput);
  var fullpath = path.join(__dirname, pathoutput);
  res.download(fullpath, (err) => {
    if (err) {
      fs.unlinkSync(pathoutput);
      res.send(err);
    }
    fs.unlinkSync(pathoutput);
  });
});

app.listen(5000, () => {
  console.log("Server is listening on Port 5000");
});
