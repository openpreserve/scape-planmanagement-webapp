package scape.support;

import java.io.IOException;
import java.net.MalformedURLException;
import java.util.Enumeration;
import java.util.Properties;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.http.Header;
import org.apache.http.HttpResponse;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.methods.HttpEntityEnclosingRequestBase;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpHead;
import org.apache.http.client.methods.HttpOptions;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.client.methods.HttpUriRequest;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.InputStreamEntity;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.HttpClientBuilder;

/**
 * A simple servlet that delegates calls to another service, passing through any
 * entities untouched. The only things it adds/removes are headers relating to
 * authentication to the resource delegated to, as that is considered to be part
 * of the implementation of that resource.
 * 
 * @author Donal Fellows
 */
public class DelegateServlet extends HttpServlet {
	private static final long serialVersionUID = -9186580865272402646L;
	private String baseURL;
	private String targetURL;
	private CredentialsProvider credentials;

	@SuppressWarnings("serial")
	private static class PrefixStringProperties extends Properties {
		private final String prefix;

		public PrefixStringProperties(String prefix) {
			this.prefix = prefix + ".";
		}

		@Override
		public String get(Object key) {
			return super.getProperty(prefix + key);
		}
	}

	@Override
	public void init() throws ServletException {
		super.init();

		String prefix = getInitParameter("config-prefix");
		PrefixStringProperties p = new PrefixStringProperties(prefix);
		try {
			p.load(getServletContext().getResourceAsStream(
					"/WEB-INF/scape.properties"));
		} catch (IOException e) {
			log("failed to initialize execution service configuration", e);
		}

		baseURL = p.get("servletURL.RE");
		if (baseURL == null)
			log("no property for " + prefix + ".servletURL.RE");

		targetURL = p.get("delegateURL");
		if (targetURL == null)
			log("no property for " + prefix + ".delegateURL");

		String user = p.get("username");
		String pass = p.get("password");
		if (user != null && pass != null) {
			credentials = new BasicCredentialsProvider();
			credentials.setCredentials(AuthScope.ANY,
					new UsernamePasswordCredentials(user, pass));
		} else if (user != null)
			log("no property for " + prefix + ".password but " + prefix
					+ ".username specified");
		else if (pass != null)
			log("no property for " + prefix + ".username but " + prefix
					+ ".password specified");
	}

	private boolean isFiltered(String headerName) {
		if ("WWW-Authenticate".equalsIgnoreCase(headerName))
			return true;
		if ("Authorization".equalsIgnoreCase(headerName))
			return true;
		return false;
	}

	HttpResponse delegate(HttpUriRequest request,
			HttpServletRequest origRequest, HttpServletResponse response)
			throws IOException {
		// Copy across the request headers
		Enumeration<String> names = origRequest.getHeaderNames();
		while (names.hasMoreElements()) {
			String name = names.nextElement();
			if (isFiltered(name))
				continue;
			Enumeration<String> values = origRequest.getHeaders(name);
			while (values.hasMoreElements())
				request.addHeader(name, values.nextElement());
		}

		// Perform the request
		log("about to " + request.getMethod() + " to " + request.getURI());
		HttpClientContext context = HttpClientContext.create();
		context.setCredentialsProvider(credentials);
		HttpResponse resp = HttpClientBuilder.create().build()
				.execute(request, context);

		// Funnel back the response
		response.setStatus(resp.getStatusLine().getStatusCode());
		for (Header h : resp.getAllHeaders())
			if (!isFiltered(h.getName()))
				response.addHeader(h.getName(), h.getValue());
		if (resp.getEntity() != null)
			resp.getEntity().writeTo(response.getOutputStream());
		return resp;
	}

	String getRealTargetUrl(HttpServletRequest request) {
		String url = request.getRequestURI().replaceFirst(baseURL, targetURL);
		if (request.getQueryString() != null)
			url += "?" + request.getQueryString();
		return url;
	}

	HttpEntityEnclosingRequestBase setSubmitEntity(
			HttpEntityEnclosingRequestBase operation, HttpServletRequest request)
			throws IOException {
		operation.setEntity(new InputStreamEntity(request.getInputStream(),
				ContentType.parse(request.getContentType())));
		return operation;
	}

	@Override
	protected void doHead(HttpServletRequest req, HttpServletResponse resp)
			throws MalformedURLException, IOException {
		delegate(new HttpHead(getRealTargetUrl(req)), req, resp);
	}

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws MalformedURLException, IOException {
		delegate(new HttpGet(getRealTargetUrl(req)), req, resp);
	}

	@Override
	protected void doOptions(HttpServletRequest req, HttpServletResponse resp)
			throws MalformedURLException, IOException {
		delegate(new HttpOptions(getRealTargetUrl(req)), req, resp);
	}

	@Override
	protected void doDelete(HttpServletRequest req, HttpServletResponse resp)
			throws MalformedURLException, IOException {
		delegate(new HttpDelete(getRealTargetUrl(req)), req, resp);
	}

	@Override
	protected void doPut(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
		delegate(setSubmitEntity(new HttpPut(getRealTargetUrl(req)), req), req,
				resp);
	}

	@Override
	protected void doPost(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
		delegate(setSubmitEntity(new HttpPost(getRealTargetUrl(req)), req),
				req, resp);
	}
}
