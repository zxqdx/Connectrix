/**
 * A download tool for downloading and unzipping dataset from common crawl.
 *
 * Usage: node <this_file> <fragment_start_index> <fragment_end_index> [<path_file_path> <download_file_path>]
 * Note: fragment_start_index >= 1
 * 
 * @author (Jackie) Xiangqing Zhang
 * @email zxq001zxq001@gmail.com
 */

var fs = require('fs');
var https = require('https');
var async = require('async');
var zlib = require('zlib');
var exec = require('child_process').exec;

var HTTP_ROOT = "https://aws-publicdatasets.s3.amazonaws.com/";
var CONCURRENT_LIMIT_DOWNLOADS = 3;

var args = process.argv;
var start_index = parseInt(args[2]),
    end_index = parseInt(args[3]);
var pathsFile = args[4] || '/grid/0/dataset/wat.paths.short';
var saveFolder = args[5] || '/grid/0/dataset/downloaded/';

var pathList = fs.readFileSync(pathsFile).toString().split('\n').slice(start_index - 1, end_index);
var total = end_index - start_index + 1;
var count = 0;
var q = async.queue(function(task, callback) {
  console.log("Downloading:" + task.fileURL);
  fileURL = task.fileURL;
  var fileName = fileURL.split('/').slice(-1)[0];
  var writeFileStream = fs.createWriteStream(saveFolder + fileName);
  https.get(fileURL, function(res) {
    console.log("Downloading: " + fileName);
    res.pipe(writeFileStream);
    writeFileStream.on('finish', function() {
      console.log("Downloaded: " + fileName);
      console.log("Unzipping: " + fileName);
      exec('gunzip ' + saveFolder + fileName, function(error, stdout, stderr) {
        count++;
        console.log("Finished: " + fileName);
        console.log("Progress: " + count + " / " + total);
        callback();
      });
    });
  });
}, CONCURRENT_LIMIT_DOWNLOADS);

for (var i = 0; i < pathList.length; i++) {
  q.push({fileURL: HTTP_ROOT + pathList[i]});
}
