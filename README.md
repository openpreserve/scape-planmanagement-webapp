SCAPE Plan Management Web App
==============================

## Building

Checkout and build the WAR file or if you're using the prepacked fcrepo.war file from 
https://github.com/openplanets/scape-fcrepo4-connector/blob/master/README_INSTALL_AND_USAGE.md
you can use the prepackaged plans.war file provided on Google Drive:

[Prepackaged War File](https://drive.google.com/file/d/0B5nd_qlYdcqyNTQtUHNiMFVJNDA/edit?usp=sharing)

```bash
$ git clone https://github.com/openplanets/scape-planmanagement-webapp.git
$ cd scape-planmanagement-webapp
$ mvn clean install
```


## Configuration

Check and update the settings in the file `src/main/webapp/WEB-INF/scape.properties`
```bash
$ vim src/main/webapp/WEB-INF/scape.properties
```

The comments in the file are mostly self-explanatory; however, to be clear:

 * `repository.delegateURL` indicates the URL of the REST interface of the repository storing the Preservation Plans.

 * `repository.username` and `repository.password` give the credentials to use to contact the Preservation Plan repository.

 * `execute.delegateURL` indicates the URL of the REST interface of the SCAPE execution service instance.

 * `execute.username` and `execute.password` give the credentials to use to contact the SCAPE execution service instance.

Note that the contents of the `scape.properties` file are _not_ readable by clients; users
cannot read the credentials to either service.

## Installation

Copy the WAR file to a Servlet Container e.g. Tomcat 7:
```bash
$ cp target/scape-planmanagement-webapp-{version}.war /path/to/tomcat/webapps/plans.war
```

Navigate your Browser to e.g. `http://localhost:8080/plans`

