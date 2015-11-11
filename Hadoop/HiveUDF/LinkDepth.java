package edu.rosehulman.zhangx2;

import org.apache.commons.lang.StringUtils;
import org.apache.hadoop.hive.ql.exec.UDF;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.Text;

public class LinkDepth extends UDF {
	public IntWritable evaluate(final Text url) {
		if (url == null) {
			return new IntWritable(0);
		}
		String temp = url.toString();
		temp = temp.replaceAll("//", "");
		return new IntWritable(StringUtils.countMatches(temp, "/"));
	}
}
