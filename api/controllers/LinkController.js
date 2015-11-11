/**
 * LinkController
 *
 * @description :: Server-side logic for managing Links
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  showLink: function(req, res) {
    var from = req.param('from');
    var to = req.param('to');
    if (!from) {
      return res.json({
        success: false,
        content: 'Must specify from domain!'
      });
    }
    var singleDomain = !to || to === '';
    var rawResults = [];
    var rawStats = {};
    if (!singleDomain) {
      async.series([function(callback) {
        Link.find({
          fromDomain: from,
          toDomain: to
        }, function(err, domains) {
          if (err) {
            return res.json({
              success: false,
              content: 'Error while reading from database. ' + err
            });
          }
          rawResults = rawResults.concat(domains);
          callback();
        });
      }, function(callback) {
        if (from !== to) {
          Link.find({
            fromDomain: to,
            toDomain: from
          }, function(err, domains) {
            if (err) {
              return res.json({
                success: false,
                content: 'Error while reading from database. ' + err
              });
            }
            rawResults = rawResults.concat(domains);
            callback();
          });
        } else {
          callback();
        }
      }, function(callback) {
        // Stats
        //   totalCount: total # of links
        //   from & to:
        //     count: # of links that goes from this domain to another domain
        //     totalDepth: total link depth
        //     typeDist: link type distribution
        //     altCount: # of links that have alt attribute
        //
        rawStats.totalCount = rawResults.length;
        rawStats.from = {
          count: 0,
          totalDepth: 0,
          typeDist: {},
          altCount: 0
        };
        rawStats.to = JSON.parse(JSON.stringify(rawStats.from));
        rawResults.forEach(function(eachLink) {
          if (eachLink.fromDomain == from) {
            rawStats.from.count++;
            rawStats.from.totalDepth += eachLink.fromDepth ? eachLink.fromDepth : 0;
            rawStats.from.altCount += eachLink.linkAlt ? 0 : 1;
            if (!rawStats.from.typeDist.hasOwnProperty(eachLink.linkType)) {
              rawStats.from.typeDist[eachLink.linkType] = 1;
            } else {
              rawStats.from.typeDist[eachLink.linkType]++;
            }
            if (eachLink.toDomain == to) {
              rawStats.to.totalDepth += eachLink.toDepth ? eachLink.toDepth : 0;
            }
          } else {
            rawStats.to.count++;
            rawStats.to.totalDepth += eachLink.toDepth ? eachLink.toDepth : 0;
            rawStats.to.altCount += eachLink.linkAlt ? 0 : 1;
            if (!rawStats.to.typeDist.hasOwnProperty(eachLink.linkType)) {
              rawStats.to.typeDist[eachLink.linkType] = 1;
            } else {
              rawStats.to.typeDist[eachLink.linkType]++;
            }
            if (eachLink.fromDomain === from) {
              rawStats.from.totalDepth += eachLink.fromDepth ? eachLink.fromDepth : 0;
            }
          }
        });
        callback();
      }, function() {
        return res.json({
          success: true,
          content: {
            stats: rawStats,
            list: rawResults
          }
        });
      }]);
    } else {
      var domainQueue = [];
      var domainSet = {
        from: true
      };
      // Graph
      //   name: domain name
      //   children: [{
      //     name: child domain name
      //     count: # of links from parent node to this child node
      //     totalToDepth: total toDepth of links that are from parent node to it
      //     totalFromDepth: total fromDepth of links that are from parent node to it
      //     children: [{}, ...]
      //   }, ...]
      var domainGraph = {
        name: from,
        children: []
      };
      var tempMap = {};
      var tempNestedMap = {};
      // Stats
      //   totalCount: total # of links
      //   totalDepth: total link depth length
      //   totalDomains: total # of unique domains
      //
      rawStats = {
        totalCount: 0,
        totalToDepth: 0,
        totalFromDepth: 0,
        totalDomains: 0
      };
      async.series([function(callback) {
        Link.find({
          fromDomain: from,
          toDomain: {
            '!': from
          }
        }, function(err, results) {
          results.forEach(function(eachLink) {
            var eachTo = eachLink.toDomain;
            rawStats.totalCount++;
            rawStats.totalToDepth += eachLink.toDepth;
            rawStats.totalFromDepth += eachLink.fromDepth;
            if (!tempMap.hasOwnProperty(eachTo)) {
              tempMap[eachTo] = {
                name: eachTo,
                count: 0,
                totalToDepth: 0,
                totalFromDepth: 0,
                children: []
              };
            }
            if (domainQueue.indexOf(eachTo) == -1) {
              domainQueue.push(eachTo);
            }
            if (!domainSet.hasOwnProperty(eachTo)) {
              domainSet[eachTo] = true;
            }
            tempMap[eachTo].count++;
            tempMap[eachTo].totalToDepth += eachLink.toDepth;
            tempMap[eachTo].totalFromDepth += eachLink.fromDepth;
          });
          callback();
        });
      }, function(callback) {
        var taskList = [];
        for (var i = 0; i < domainQueue.length; i++) {
          var eachChildName = domainQueue[i];
          tempNestedMap[eachChildName] = {};
          taskList.push((function(eachChildName) {
            return function(callback2) {
              Link.find({
                fromDomain: from,
                toDomain: {
                  '!': from
                }
              }, function(err, results) {
                results.forEach(function(eachLink) {
                  var eachTo = eachLink.toDomain;
                  rawStats.totalCount++;
                  rawStats.totalToDepth += eachLink.toDepth;
                  rawStats.totalFromDepth += eachLink.fromDepth;
                  if (!tempNestedMap[eachChildName].hasOwnProperty(eachTo)) {
                    tempNestedMap[eachChildName][eachTo] = {
                      name: eachTo,
                      count: 0,
                      totalToDepth: 0,
                      totalFromDepth: 0
                    };
                  }
                  if (!domainSet.hasOwnProperty(eachTo)) {
                    domainSet[eachTo] = true;
                  }
                  tempNestedMap[eachChildName][eachTo].count++;
                  tempNestedMap[eachChildName][eachTo].totalToDepth += eachLink.toDepth;
                  tempNestedMap[eachChildName][eachTo].totalFromDepth += eachLink.fromDepth;
                });
                callback2();
              });
            };
          })(eachChildName));
          taskList.push((function(eachChildName) {
            return function(callback3) {
              Link.find({
                fromDomain: {
                  '!': from
                },
                toDomain: from
              }, function(err, results) {
                results.forEach(function(eachLink) {
                  var eachFrom = eachLink.fromDomain;
                  rawStats.totalCount++;
                  rawStats.totalFromDepth += eachLink.toDepth;
                  rawStats.totalToDepth += eachLink.fromDepth;
                  if (!tempNestedMap[eachChildName].hasOwnProperty(eachFrom)) {
                    tempNestedMap[eachChildName][eachFrom] = {
                      name: eachFrom,
                      count: 0,
                      totalToDepth: 0,
                      totalFromDepth: 0
                    };
                  }
                  if (!domainSet.hasOwnProperty(eachFrom)) {
                    domainSet[eachFrom] = true;
                  }
                  tempNestedMap[eachChildName][eachFrom].count++;
                  tempNestedMap[eachChildName][eachFrom].totalFromDepth += eachLink.toDepth;
                  tempNestedMap[eachChildName][eachFrom].totalToDepth += eachLink.fromDepth;
                });
                callback3();
              });
            };
          })(eachChildName));
        }
        async.series(taskList, function(err) {
          for (var i = 0; i < domainQueue.length; i++) {
            var eachChildName = domainQueue[i];
            for (var eachSubChild in tempNestedMap[eachChildName]) {
              if (tempNestedMap[eachChildName].hasOwnProperty(eachSubChild)) {
                tempMap[eachChildName].children.push(tempNestedMap[eachChildName][eachSubChild]);
              }
            }
          }
          callback();
        });
      }, function() {
        rawStats.totalDomains = Object.keys(domainSet).length;
        for (var i = 0; i < domainQueue.length; i++) {
            domainGraph.children.push(tempMap[domainQueue[i]]);
        }
        return res.json({
          success: true,
          content: {
            stats: rawStats,
            graph: domainGraph
          }
        });
      }]);
    }
  }
};