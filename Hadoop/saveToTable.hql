ADD JAR hdfs:///tmp/PigToHive/json-serde-1.3.7-SNAPSHOT-jar-with-dependencies.jar;

CREATE DATABASE IF NOT EXISTS connectrix;
USE connectrix;

DROP FUNCTION IF EXISTS udfdomain;
DROP FUNCTION IF EXISTS udfdepth;
DROP FUNCTION IF EXISTS udftype;

DROP TABLE IF EXISTS temp;
CREATE TABLE temp (
  warcTargetUri string,
  hostname string,
  links array<struct<href: string, path: string, url: string, alt: string>>
)
ROW FORMAT SERDE 'org.openx.data.jsonserde.JsonSerDe'
STORED AS TEXTFILE;
LOAD DATA INPATH '/tmp/PigToHive/results/*' OVERWRITE INTO TABLE temp;

DROP TABLE IF EXISTS aux;
CREATE TABLE aux (
  fromDomain string,
  toDomain string,
  fromURL string,
  toURL string,
  fromDepth int,
  toDepth int,
  linkType string,
  linkURL string,
  linkAlt string
)
ROW FORMAT DELIMITED FIELDS TERMINATED BY '\t';

CREATE FUNCTION udfdomain AS 'edu.rosehulman.zhangx2.LinkDomain' USING JAR 'hdfs:///tmp/PigToHive/Milestone8-HiveUDF-0.0.1-SNAPSHOT.jar';
CREATE FUNCTION udfdepth AS 'edu.rosehulman.zhangx2.LinkDepth' USING JAR 'hdfs:///tmp/PigToHive/Milestone8-HiveUDF-0.0.1-SNAPSHOT.jar';
CREATE FUNCTION udftype AS 'edu.rosehulman.zhangx2.LinkType' USING JAR 'hdfs:///tmp/PigToHive/Milestone8-HiveUDF-0.0.1-SNAPSHOT.jar';

Insert INTO table aux SELECT udfdomain(warcTargetUri, link.url, 0) AS fromDomain, udfdomain(warcTargetUri, link.url, 1) AS toDomain, warcTargetUri AS fromURL, link.url AS toURL, udfdepth(warcTargetUri) AS fromDepth, udfdepth(link.url) AS toDepth, udftype(link.path) AS linkType, link.url AS linkURL, link.alt AS linkAlt FROM temp LATERAL VIEW explode(links) tmp AS link;

SELECT COUNT(*) from aux;
DESCRIBE aux;
