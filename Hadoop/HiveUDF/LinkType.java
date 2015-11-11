package edu.rosehulman.zhangx2;

import org.apache.hadoop.hive.ql.exec.UDF;
import org.apache.hadoop.io.Text;

public class LinkType extends UDF {
	public Text evaluate(final Text path) {
		if (path == null) {
			return null;
		}
		String temp = path.toString();
		String[] arr = temp.split("@");
		return new Text(arr[0]);
	}
}
