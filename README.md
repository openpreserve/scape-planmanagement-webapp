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

Check and update the settings in the file `src/main/webapp/js/config.js`
```bash
$ vim src/main/webapp/WEB-INF/scape.properties
```

## Installation

Copy the WAR file to a Servlet Container e.g. Tomcat 7:
```bash
$ cp target/scape-planmanagement-webapp-{version}.war /path/to/tomcat/webapps/plans.war
```

Navigate your Browser to e.g. `http://localhost:8080/plans`

