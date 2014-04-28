package scape.support;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Enumeration;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.http.Header;
import org.apache.http.HttpHost;
import org.apache.http.HttpResponse;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.client.methods.HttpUriRequest;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.InputStreamEntity;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.HttpClientBuilder;

@SuppressWarnings("serial")
public class DelegateServlet extends HttpServlet {
	String baseURL;
	String targetURL;
	HttpClient client;
	HttpClientContext context;

	private HttpHost getHttpHost(String url) throws URISyntaxException {
		URI uri = new URI(url);
		return new HttpHost(uri.getHost(), uri.getPort(), uri.getScheme());
	}

	@Override
	public void init() throws ServletException {
		baseURL = getServletContext().getInitParameter("executeServletURL");
		targetURL = getServletContext().getInitParameter("serverInstance");
		client = HttpClientBuilder.create().build();
		context = HttpClientContext.create();
		try {
			String user = getServletContext().getInitParameter("username");
			String pass = getServletContext().getInitParameter("password");
			if (user != null && pass != null) {
				CredentialsProvider cp = new BasicCredentialsProvider();
				cp.setCredentials(new AuthScope(getHttpHost(targetURL)),
						new UsernamePasswordCredentials(user, pass));
				context.setCredentialsProvider(cp);
			}
		} catch (URISyntaxException e) {
			throw new ServletException(
					"failed to initialize execution service credentials", e);
		}
	}

	protected HttpResponse delegate(HttpUriRequest request,
			HttpServletRequest origRequest, HttpServletResponse response)
			throws IOException {
		// Copy across the request headers
		Enumeration<String> names = origRequest.getHeaderNames();
		while (names.hasMoreElements()) {
			String name = names.nextElement();
			if ("WWW-Authenticate".equalsIgnoreCase(name))
				continue;
			Enumeration<String> values = origRequest.getHeaders(name);
			while (values.hasMoreElements())
				request.addHeader(name, values.nextElement());
		}

		// Perform the request
		HttpResponse resp = client.execute(request, context);

		// Funnel back the response
		response.setStatus(resp.getStatusLine().getStatusCode());
		for (Header h : resp.getAllHeaders())
			response.addHeader(h.getName(), h.getValue());
		resp.getEntity().writeTo(response.getOutputStream());
		return resp;
	}

	protected String getRealTargetUrl(HttpServletRequest request) {
		String url = request.getRequestURI().replaceFirst(baseURL, targetURL);
		if (request.getQueryString() != null)
			url += "?" + request.getQueryString();
		return url;
	}

	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws MalformedURLException, IOException {
		delegate(new HttpGet(getRealTargetUrl(req)), req, resp);
	}

	@Override
	public void doPut(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
		HttpPut put = new HttpPut(getRealTargetUrl(req));
		put.setEntity(new InputStreamEntity(req.getInputStream(), ContentType
				.parse(req.getContentType())));
		delegate(put, req, resp);
	}

	@Override
	public void doPost(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
		HttpPost post = new HttpPost(getRealTargetUrl(req));
		post.setEntity(new InputStreamEntity(req.getInputStream(), ContentType
				.parse(req.getContentType())));
		delegate(post, req, resp);
	}
}
