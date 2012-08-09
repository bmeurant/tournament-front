Tournament-front
----------------

This project is a sample application build over `Resthub js`_.

This application is currently being developed in order to learn this stack and its frameworks and discover
their patterns and anti-patterns and build my own opinion on these tools. For these reasons, the source
code is continuously modified and refactored.

One of the main goal is also to be able to provide advices, patterns and support to developers building an
architecture over this stack :

- How to organize views ?
- What strategy for rendering ?
- How to manage and navigate between multiple views ?
- How to manage multiple routers ?
- etc.

The sample application should allow to create, manage and plan games and tournaments made of participants and/or
teams and dynamic rules descriptions (with a pre existent set of games and tournaments types).

Complementary tools
+++++++++++++++++++

In addition to the basic tools provides by `Resthub js`_, I progressively discovered that some complementary
tools had to be considered for some usages.

Bonus question : Do these tools could/should be added to standard `Resthub js`_ distribution ?

These tools are described below :

Template engine : Handlebars
****************************

Default template rendering is provided by `Underscore.js`_ embedding a Javascript micro templating combined
with underscore helpers which allows a JSP-like syntax :

::

    <% _.each(participants, function(participant, index){
        if (_.indexOf(deleted, participant.id) < 0) { %>
            <li id="<%= participant.id %>" class="thumbnail <% if (id_selected == participant.id) {print ('selected');}%>" draggable="true">
                <input type="hidden" value="<%= index %>"/>
                    <a href="/participant/<%= participant.id %>" class="plain participant-thumb">
                        <div class="participant-thumb">
                            <% if (!participant.picture_url) { %>
                            <img class="photo" src="/img/participants/no-photo.jpg" draggable="false" alt=""/>
                            <% }
                            else
                            { %>
                            <img class="photo" src="<%= server_url %><%= participant.picture_url %>" alt="" draggable="false"/>
                            <p hidden><img src="<%= server_url %><%= participant.pict_min %>"/></p>
                            <% } %>
                        </div>
                        <h5><%= participant.firstname %>&nbsp;<%= participant.lastname %></h5>
                    </a>
            </li>
        <% }
    }); %>

If this could initially appear easy to use and comfortable, it **looks very ugly** and I realize that **it encouraged
me to implement a lot of view logic in templates** and made difficult to reuse templates.

I quickly switch to a **logic-less template with** Handlebars_. ::

    {{#each participants}}
        {{#with this}}
            <li id="{{id}}" class="thumbnail {{selected id}} {{disabled id}}" draggable="true">
                <a href="/participant/{{id}}" class="plain participant-thumb">
                    <div class="participant-thumb">
                        {{#if picture_url}}
                            <img class="photo" src="{{photo_link picture_url}}" alt="" draggable="false"/>
                            <p hidden><img src="{{photo_link pict_min}}"/></p>
                        {{else}}
                            <img class="photo" src="/img/participants/no-photo.jpg" draggable="false" alt=""/>
                        {{/if}}
                    </div>
                    <h5>{{firstname}}&nbsp;{{lastname}}</h5>
                </a>
                {{#if_deleted id}}
                    <div class="foreground"></div>
                {{/if_deleted}}
            </li>
        {{/with}}
    {{/each}}

Obviously this operation required to define Handlebars_ **Helpers** in order to implement the logic that disappeared
from the template :

- **Add element class selected (inline) if needed**
- **Add element class disabled (inline) if needed**
- **Is the current element deleted ?**
- **Display photo_link**

**View specific helpers**::

    initialize:function () {

        ...

        Handlebars.registerHelper('if_deleted', function (id, options) {
            if (this.deleted.indexOf(id) >= 0) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        }.bind(this);

        Handlebars.registerHelper('disabled', function (id) {
            return (this.deleted.indexOf(id) >= 0) ? 'disabled' : '';
        }.bind(this));

        Handlebars.registerHelper('selected', function (id) {
            return (this.idSelected && this.idSelected == id) ? "selected" : "";
        }.bind(this));

        ...
    }

**Global helpers (`app.js`)**::

    initialize:function () {

        ...

        Handlebars.registerHelper('photo_link', function (picture_url) {
            return "http://localhost:3000/api" + picture_url;
        });

        ...
    }

It could seem heavy but most of these helpers could be reused and finally the logic really moved to view and that
is a good thing !


Form validation : Backbone Validation
*************************************



Query parameter support : Backbone Query Parameters
***************************************************

List pagination : Backbone Pagination
*************************************

Asynchronous calls : Async.js
*****************************


Architectural considerations and questions
++++++++++++++++++++++++++++++++++++++++++

During this work I had to resolve some architectural and design problematics and to experiment and finally choose
a pattern to apply. These choices and eventually their relative code are described below. Some questions are still
opened and need a better comprehension of underlying technical aspects for me to respond. Arguments and ideas are
welcomed.

Router 'intelligence'
*********************

Zombie views problem
********************
close
unbind events
unbind Pubsub subscribers
close nested views

Singleton views
***************

Consistent rendering strategy
*****************************

Manage PushState
****************

Handlebars helpers
******************

Multiple routers
****************

.. _Resthub js: http://resthub.org/2/backbone-stack.html
.. _Underscore.js: http://underscorejs.org/
.. _Handlebars: https://github.com/wycats/handlebars.js
.. _Backbone.js: http://backbonejs.org/