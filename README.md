# cryptoBoto on Docker

cryptoBoto polls [QuadrigaCX](https://www.quadrigacx.com) for currency data, stores it in a Postgres database, and displays it in a chart in your browser.

*After downloading the repository, re-name the folder to "cryptoBoto-Docker", if necessary.  Otherwise, the optional stop and restart shell scripts won't work.*

In your command line interface:

- change to your cryptoBoto-Docker directory
- execute `docker-compose up`
- go to [localhost:4000](http://localhost:4000) in your browser
- quit the application by pressing Ctrl+C

*OPTIONAL*

To **preserve data** you have collected:

- **IMPORTANT**. For these scripts to work, your working directory must be named cryptoBoto-Docker before starting the app.
- make the restart shell script executable with `chmod u+x restart-cryptoBoto.sh`
- make the stop shell script executable with `chmod u+x stop-cryptoBoto.sh`
- **restart cryptoBoto** by executing `restart-cryptoBoto.sh`
- **stop cryptoBoto** by executing `stop-cryptoBoto.sh`