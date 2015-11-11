hadoop fs -cp /tmp/pigOutput/2015-11-05/part-v000-o000-r-00000 /tmp/PigToHive
hive -f saveToTable.hql
