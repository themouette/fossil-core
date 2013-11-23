---
title: Fossil module orchestration
---

In previous steps you learned how to create standalone and reusable modules, in
this chapter you will learn how to make several module communicate.

Throug this tutorial you will build a mail application, with folders.

## Setup

First thing, go into an empty directory and initialize your project as both npm
and bower project, and install dependencies:

``` bash
$ npm init
$ bower init
$ npm install --save-dev grunt grunt-contrib-watch grunt-contrib-connect grunt-contrib-concat grunt-concurrent
$ bower install --save fossil-core fossil-view requirejs jquery backbone underscore
```

Once all dependencies are installed, copy the fossil skeleton application and
create 3 modules:

``` bash
$ cp -r bower_components/fossil-core/skeleton/{src,index.html,Gruntfile.js} .
$ mkdir -p src/modules/{folder,compose,conversation}
```

### Folder module

Folder module shows the list of available folders and a button to compose a new
mail.

It triggers following actions:

* show folder
* compose

It accepts following commands:

* refresh mails

### Compose module

Compose module provides a form to create a new mail or edit a draft.

This module triggers following actions:

* send mail
* save draft
* destroy draft

It should be possible to set a draft to resume draft edition.

### Conversation

In charge of displaying the mail list as well as the mail show.

This module triggers following actions:

* trash mail

It accepts following commands:

* refresh mails

### Application

Application is the module is in charge of orchestrating other modules and
creating the application layout.

Application layout contains 2 regions: left and main.

Left pannel contains a list of available folders, and main panel can contain the
compose or conversation module, depending on context.

To get start
