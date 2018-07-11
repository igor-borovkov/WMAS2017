The Web Media API Snapshot Tests Project
========================================

The Web Media API Snapshot Tests Project is a cross-browser testsuite. Writing
tests in a way that allows them to be run in all browsers gives browser projects
confidence that they are shipping software that is compatible with other
implementations, and that later implementations will be compatible with
their implementations. This in turn gives Web authors/developers
confidence that they can actually rely on the Web platform to deliver on
the promise of working across browsers and devices without needing extra
layers of abstraction to paper over the gaps left by specification
editors and implementors.

This project is forked from the original
[web-platform-tests Project](https://github.com/web-platform-tests/wpt) is customized
to run on web browsers for embedded devices and appliances suchs as TV sets,
set-top boxes, consoles, etc. It supports tests report comparing and testing
a chosen subset of API tests.

Test server
===========
The server makes it possible to run all tests in a single window.

## Setup
Generate hosts file:
```
$ ./wpt make-hosts-file | sudo tee -a /etc/hosts
```
on Windows:
```
$ python wpt make-hosts-file | Out-File %SystemRoot%\System32\drivers\etc\hosts -Encoding ascii -Append
```

Generate test subset, call from WPT root directory:
```
$ ./wmas2017-subset.sh
```

Initialize WAVE Server:
```
$ ./wave init
```

Start WAVE Server:
```
$ ./wave start
```

Start Web Platform Test runner:
```
$ ./wpt serve
```

## Configuration
The default configuration is loaded from the ```config.default.json```
in the root directory. Configurations from the ```config.json```
in the same format as the ```config.default.json```override those.

Provide a different location with ```--config < path_to_config >``` as a
start parameter.

## Test Run Parameters
It is possible to parameterize a test run with various query parameters
provided with the query in the url of the initial request.

Example:
```
web-platform.test/?path=/2dcontext&types=testharness
```

### Query Parameters
Parameter|Description|Example
------|------|------
`path`|Specify tests to run. Can be directory or file. Multiple paths can be chained by using `, `. Paths with leading '/' are interpreted as absolute paths, paths without as regular expressions. (Default: ```/```)|```web-platform.test/?path=/2dcontext```
types|What types of tests to run. Possible types: ```testharness```, ```manual``` and ```reftest``` (Default: ```testharness```)|```web-platform.test/?types=testharness,manual```
`timeout`|Specify a server side timeout in ms after which a test with no result is timed out|```web-platform.test/?timeout=65000```
`token` and `resume` |Providing a token of an unfinished session will resume it.|```web-platform.test/?token=2fb0fb80-63db-4425-8a76-2ea3e6f8269d&resume=1```

Certificates
============

By default pregenerated certificates for the web-platform.test domain
are provided in [`tools/certs`](tools/certs). If you wish to generate new
certificates for any reason it's possible to use OpenSSL when starting
the server, or starting a test run, by providing the
`--ssl-type=openssl` argument to the `wpt serve` or `wpt run`
commands.

If you installed OpenSSL in such a way that running `openssl` at a
command line doesn't work, you also need to adjust the path to the
OpenSSL binary. This can be done by adding a section to `config.json`
like:

```
"ssl": {"openssl": {"binary": "/path/to/openssl"}}
```

### Trusting Root CA

To prevent browser SSL warnings when running HTTPS tests locally, the
web-platform-tests Root CA file `cacert.pem` in [tools/certs](tools/certs)
must be added as a trusted certificate in your OS/browser.

