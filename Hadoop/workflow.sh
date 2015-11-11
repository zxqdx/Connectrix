#!/bin/sh

# Usage: workflow.sh <start_index> <end_index>
# Note: start_index >= 1

echo "### Required commands:"
echo "### -- node"
echo "### -- npm"
echo "### -- hadoop"
echo "### -- pig"
echo "### -- hive"
echo "### -- sqoop"
echo "### -- mysql"
echo ""

echo "### Required files:"
echo "### -- download_dataset.js"
echo "### -- package.json"
echo "### -- wat.paths.short"
echo "### -- jsFunc.js"
echo "### -- parse.pig"
echo "### -- pig.sh"
echo "### -- json-serde-1.3.7-SNAPSHOT-jar-with-dependencies.jar"
echo "### -- saveToTable.hql"
echo "### -- Milestone8-HiveUDF-0.0.1-SNAPSHOT.jar"
echo ""

datetime=`date +%Y-%m-%d`;

echo "### Preparing for downloading dataset ..."
rm -rf downloaded/
mkdir ./downloaded
rm -rf node_modules/
npm install
echo "### Downloading from $1 to $2 ..."
node download_dataset.js $1 $2 wat.paths.short ./downloaded/

echo "### Preparing for Pig ..."
hadoop fs -mkdir /tmp/pigInput
hadoop fs -put -f jsFunc.js /tmp/pigInput/
hadoop fs -rmr -skipTrash /tmp/PigToHive/results/
hadoop fs -mkdir -p /tmp/PigToHive/results/
echo ""

echo "### Running Pig ..."
for f in downloaded/*.wat ; do
    if [[ ! -d $f ]]; then
        eachfile=`basename $f`
        echo "### -- $eachfile aux ..."
        rm -rf aux/
        mkdir ./aux
        cp $f aux/aux.wat
        cd aux/
        split --bytes 1M --numeric-suffixes --suffix-length=3 aux.wat aux
        rm -rf aux.wat
        cd ..
        hadoop fs -rmr -skipTrash /tmp/pigInput/aux/
        hadoop fs -put ./aux/ /tmp/pigInput/
        for d in aux/*; do
            if [[ ! -d $d ]]; then
                eachaux=`basename $d`
                echo "### ---- Starting $eachaux ..."
                hadoop fs -rmr -skipTrash /tmp/pigOutput/
                ./pig.sh $eachaux
                echo "### ---- Cleaning $eachaux ..."
                hadoop fs -cp /tmp/pigOutput/$datetime/part-v000-o000-r-00000 /tmp/PigToHive/results/$eachfile$eachaux
                echo "### ---- Finished $eachaux ..."
            fi
        done
    fi
done
echo ""

echo "### Preparing for Hive ..."
hadoop fs -put -f json-serde-1.3.7-SNAPSHOT-jar-with-dependencies.jar /tmp/PigToHive/
hadoop fs -put -f Milestone8-HiveUDF-0.0.1-SNAPSHOT.jar /tmp/PigToHive/
echo ""

echo "### Running for Hive ..."
hive -f saveToTable.hql
echo ""

echo "### running Sqoop export ..."
sqoop export --connect jdbc:mysql://localhost/connectrix --driver com.mysql.jdbc.Driver --username root --table Link -m 1 --hcatalog-database connectrix --hcatalog-table aux --input-fields-terminated-by "\t"
echo ""