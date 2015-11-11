/**
 * LinkController
 *
 * @description :: Server-side logic for managing Links
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  showLink: function(req, res) {
    var from = req.param('from');
    var to = req.param('from');
    if (!from) {
      return res.json({
        success: false,
        content: 'Must specify from domain!'
      });
    }
    var singleDomain = !to;
    if (!singleDomain) {
      var rawResults = [];
      var rawStats = {};
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
      }, function(callback) {
        return res.json({
          success: true,
          content: {
            stats: rawStats,
            list: rawResults
          }
        });
      }]);
    } else {
      // TODO
      return res.json({
        success: false,
        content: 'Not implemented yet.'
      });
    }
  }
};