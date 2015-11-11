-- hadoop fs -put -f jsFunc.js /tmp/pigInput/
-- hadoop fs -put -f test.wat /tmp/pigInput/
-- hadoop fs -rmr /tmp/pigOutput/
-- pig -x tez -param input=/tmp/pigInput/test.wat -param output=/tmp/pigOutput parse.pig
-- hadoop fs -rm /tmp/PigToHive/part-v000-o000-r-00000
-- hadoop fs -cp /tmp/pigOutput/2015-11-05/part-v000-o000-r-00000 /tmp/PigToHive/

-- records = LOAD '/tmp/pigInput/test.wat' using PigStorage('\n');
-- dump records;

%declare FOLDERNAME `date +%Y-%m-%d`;
REGISTER 'hdfs:///tmp/pigInput/jsFunc.js' using javascript as myfuncs;
records = LOAD '$input' using PigStorage('\n');
frecords = FILTER records by (STARTSWITH($0, '{'));
ffrecords = FILTER frecords by (myfuncs.isInteresting($0));

temp = FOREACH ffrecords GENERATE myfuncs.modifyJson($0);

-- dump ffrecords;
-- dump temp;

STORE temp into '$output/$FOLDERNAME' using PigStorage('\n');