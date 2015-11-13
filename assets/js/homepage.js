template = _.template

var counter = 0;

var parse = function(e){
  e.name = e.name + " CNT: "+ e.count+" TTD: "+ e.totalToDepth+" TFD: "+ e.totalFromDepth+counter;
  counter++;
  if(e.children){
    e.children.forEach(function(c){
      parse(c);
    })
  }
  else{
    e.size = parseInt(Math.random() * 200 + 20);
  }
};


$(document).ready(function() {
  var myFlower = new CodeFlower("#container", 400, 300);



  var request = function(FromDomain,ToDomain,callback){
    if(!FromDomain){
      alert("Must provie From Domain");
      return;
    }
    $.ajax({
      method:'GET',
      url:'/api/link',
      data:{
        from:FromDomain,
        to : ToDomain || ""
      }

    }).done(function(body){
      if(body.success){
        if(!ToDomain){

          var graph = body.content.graph;


          var children = graph.children;
          var count = 0;
          children.forEach(function(e) {
            parse(e);
          });
          var stats = body.content.stats;

          var totalCount = "TotalCount: "+stats.totalCount+"<br>";
          var totalDomains = "TotalDomains: "+stats.totalDomains+"<br>";
          var totalFromDepth = "TotalFromDepth: "+stats.totalFromDepth+"<br>";
          var totalToDepth = "TotalToDepth: "+stats.totalToDepth+"<br>";

          var finalString = totalCount+totalDomains+totalFromDepth+totalToDepth;
          finalString = finalString.replace(/ /g,'&nbsp');


          myFlower.update(graph);

          $("#dashboardText").html(finalString);
        }
        else{
          console.log(body);
          var list = body.content.list;
          var stats = body.content.stats;
          var data = [];
          list.forEach(function(e){
            var row = [];
            row.push(e.fromURL);
            row.push(e.toURL);
            row.push(e.fromDepth);
            row.push(e.toDepth);
            row.push(e.linkType);
            row.push(e.linkURL);
            row.push(e.linkAlt);
            data.push(row);
          });
          $('#table-container').html(
            '<table id="example"></table>'
          )
          $('#example').DataTable({
            data: data,
            columns: [{
              title: "fromURL",

            }, {
              title: "toURL",

            }, {
              title: "fromDepth",
              width:"20%"
            }, {
              title: "toDepth"
            }, {
              title: "linkType"
            }, {
              title: "linkURL"
            }, {
              title: 'linkAlt'
            }
            ]
          });

          if(FromDomain == ToDomain)
          {
            FromDomain = FromDomain + " ";
          }
          var jsonData = {name:FromDomain,size:500,children:[{name:ToDomain,size:500}]};

          myFlower.update(jsonData);

          //TO DO dashboard
          var avgFromDepth = stats.from.totalDepth / stats.totalCount;
          var avgToDepth = stats.to.totalDepth / stats.totalCount;
          avgFromDepth = avgFromDepth.toFixed(2);
          avgToDepth = avgToDepth.toFixed(2);

          var totalCount = "Total Count: "+stats.totalCount+"<br>";

          var from = "From :<br>";
          var fromCount = "      Count: "+stats.from.count+"<br>";
          var fromTotalDepth = "      AverageDepth: "+avgFromDepth+"<br>";
          var fromAltCount = "      AltCount: "+stats.from.altCount+"<br>";

          var fromTypeDist = "      TypeDist: "+"<br>";
          //var fromTypeDistA ="                A: "+stats.from.typeDist.A+"<br>";
          //var fromTypeDistForm ="                FORM: "+stats.from.typeDist.FORM+"<br>";



          for(var t in stats.from.typeDist){
            if(stats.from.typeDist.hasOwnProperty(t)){
              fromTypeDist += "                 "+ t+": "+stats.from.typeDist[t]+"<br>"
            }
          }

          var to = "To :"+"<br>";
          var toCount = "      Count: "+stats.to.count+"<br>";
          var toTotalDepth = "      AverageDepth: "+avgToDepth+"<br>";
          var toAltCount = "      AltCount: "+stats.to.altCount+"<br>";
          var toTypeDist = "      TypeDist: "+"<br>";

          for(var t in stats.to.typeDist){
            if(stats.to.typeDist.hasOwnProperty(t)){
              toTypeDist += "                 "+ t+": "+stats.to.typeDist[t]+"<br>"
            }
          }

          var finalString = totalCount+from+fromCount+fromTotalDepth+fromAltCount+fromTypeDist
            +to+toCount+toTotalDepth+toAltCount+toTypeDist;
          finalString = finalString.replace(/ /g,"&nbsp;");
          $("#dashboardText").html(finalString);
        }
      }
      else{
        //
      }
      callback(body);
    })
  }







  $("#submit-butn").click(function(){
    console.log("OK");
    var fromDomain = $("#fromDomain").val();
    var toDomain = $("#toDomain").val();

    request(fromDomain,toDomain,function(body){
      if(body.success){
        //alert("succeeded");
      }
      else{
        alert(body.content);
      }
    })
  })



});
