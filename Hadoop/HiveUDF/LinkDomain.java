package edu.rosehulman.zhangx2;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.hadoop.hive.ql.exec.UDF;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.Text;

public class LinkDomain extends UDF {
	public Text evaluate(final Text fromUrl, final Text toUrl, final IntWritable type) {

		if (fromUrl == null || toUrl == null) {
			return null;
		}
		boolean isFrom = true; // type == 0
		if (type.compareTo(new IntWritable(1)) == 0) { // type == 1
			isFrom = false;
		}
		String fqdn = "";
		try {
			if (isFrom) {
				URI uri = new URI(fromUrl.toString());
				fqdn = uri.getHost();
			} else {
				List<String> result = new ArrayList<String>();
				Pattern pattern = Pattern.compile("\\b(((ht|f)tp(s?)\\:\\/\\/|~\\/|\\/)|www.)"
						+ "(\\w+:\\w+@)?(([-\\w]+\\.)+(com|org|net|gov" + "|mil|biz|info|mobi|name|aero|jobs|museum"
						+ "|travel|[a-z]{2}))(:[\\d]{1,5})?" + "(((\\/([-\\w~!$+|.,=]|%[a-f\\d]{2})+)+|\\/)+|\\?|#)?"
						+ "((\\?([-\\w~!$+|.,*:]|%[a-f\\d{2}])+=?" + "([-\\w~!$+|.,*:=]|%[a-f\\d]{2})*)"
						+ "(&(?:[-\\w~!$+|.,*:]|%[a-f\\d{2}])+=?" + "([-\\w~!$+|.,*:=]|%[a-f\\d]{2})*)*)*"
						+ "(#([-\\w~!$+|.,*:=]|%[a-f\\d]{2})*)?\\b");

				Matcher matcher = pattern.matcher(toUrl.toString());
				while (matcher.find()) {
					result.add(matcher.group());
				}

				if (result.size() == 0) {
					URI uri = new URI(fromUrl.toString());
					fqdn = uri.getHost();
				} else {
					String firstRes = result.get(0);
					if (firstRes.startsWith("//")) {
						firstRes = "http:" + firstRes;
					}
					URI uri = new URI(firstRes);
					fqdn = uri.getHost();
				}
			}
		} catch (URISyntaxException e) {
			fqdn = "ERROR" + e.toString();
		}
		if (fqdn == null) {
			return new Text("unknown://");
		}
		return new Text(fqdn);
	}
}
