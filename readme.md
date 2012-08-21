Tournament-front
================

This project is a **sample application based on [Resthub js][resthubjs]**.

With this application I wanted to address the following questions:

- How to organize my views?
- What strategy for rendering?
- How to manage navigation between multiple views?
- How to set up `deep linking` ?
- How to define multiple routers and their contents?
- And so on ...

In functional terms, this application should help to create, manage and plan tournaments and games
made of participants and / or teams and based on a set of dynamically defined rules.

---
Tools
-----

Some libs, embedded or not in **[Resthub js][resthubjs]** were gradually added to meet special needs.

These tools are mainly:

- **Template engine: [Handlebars][handlebars]**
- **Form Validation: [Backbone Validation][backbone-validation]**
- **Parameters support on view routing: [Backbone Query Parameters][backbone-query-parameters]**
- **Paginated lists: [Paginator Backbone][backbone-paginator]**
- **Asynchronous calls: [Async][async]**
- **Dispatching keyboard shortcuts: [Keymaster][Keymaster]**

---
### Template engine : Handlebars

The default template engine is **[Underscore js][underscore]** which embeds a micro javascript templating lib
combined to underscore helpers. It is based on a 'JSP-like' syntax:

```html
<% _.each(participants, function(participant, index){
    if (_.indexOf(deleted, participant.id) < 0) { %>
        <li id="<%= participant.id %>" class="thumbnail <% if (id_selected == participant.id) {print ('selected');}%>" draggable="true">
            <input type="hidden" value="<%= index %>"/>
                <a href="/participant/<%= participant.id %>" class="plain participant-thumb">
                    <div class="participant-thumb">
                        <% if (!participant.pictureUrl) { %>
                            <img class="photo" src="/img/participants/no-photo.jpg" draggable="false" alt=""/>
                            <% }
                        else
                        { %>
                            <img class="photo" src="<%= server_url %><%= participant.pictureUrl %>" alt="" draggable="false"/>
                            <p hidden><img src="<%= server_url %><%= participant.pict_min %>"/></p>
                        <% } %>
                    </div>
                    <h5><%= participant.firstname %>&nbsp;<%= participant.lastname %></h5>
                </a>
        </li>
    <% }
}); %>
```

This may seem simple at first but **I really don't find it elegant**, it quickly leads to **move a good part
of the view logic to the template** and makes very difficult the reuse of templates.

So I switched to a **logic-less template engine**: **[Handlebars][handlebars]**.

```html
{{#each participants}}
    {{#with this}}
        <li id="{{id}}" class="thumbnail {{selected id}} {{disabled id}}" draggable="true">
            <a href="/participant/{{id}}" class="plain participant-thumb">
                <div class="participant-thumb">
                    {{#if pictureUrl}}
                        <img class="photo" src="{{photo_link pictureUrl}}" alt="" draggable="false"/>
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
```

... much more elegant, isn't it ?

Obviously, this requires to define **[Handlebars][handlebars] Helpers** to implement, into the view, the logic that
is no longer present in templates.

In our example:

- Add css class `selected` if necessary
- Add css class `disabled` if necessary
- Say if the current element is being deleted
- Display a custom photo link

**View-specific helpers**:

```js
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
```

**Global helpers (`handlebars-helpers.js`):**

```js
initialize:function () {

    ...

    Handlebars.registerHelper('photo_link', function (pictureUrl) {
        return App.Config.serverRootURL + pictureUrl;
    });

    ...
}
```

Having to define these helpers may seem a bit boring at first, but the syntax is much more elegant,
the majority of these helpers can be easily reused and, with a little bit of reflexion, we can reduce the amount of
technical code.

And **logic was actually moved to the view**, which is its right place, and this will greatly facilitate maintenance
and reuse.

---
### Form Validation : Backbone Validation

**[Backbone][backbone]** does not provide natively **any tool for form or validation management**. It is not necessary
to specify model attributes or related constraints.

In terms of validation, **[Backbone][backbone]** provides only empty methods `validate` and `isValid` that can
be implemented by each developer. The only guarantee that the `validate` method is called before a `save` (canceled
on error). But a complete form validation is not obvious (custom error array management ... )
And the errors are not distinguishable from inherent `save` errors (communication and so on).

As a strong validation handler is essential to me, I looked for a suitable tool according to following criteria:

- Easy to use and understand (KISS)
- **Easy to customize and extend**
- Ability to **manage complex forms**
- A complete set of built-in validators
- html5 compatible
- **[Twitter Bootstrap][twitter-bootstrap]** compatible

I started by testing **[Backbone Forms][backbone-forms]** which seems a very good tool.
But it is actually a two parts tool: **a validation logic** and **a complete tool for generating dynamic form**.
You just have to provide model fields description with constraints and form is auto generated.

This may sound promising (although I'm not fan of these '​​scaffolding' things - and even less when
dynamic). But the problem is that these tools cannot be used independently and I quickly reached the limits of customization:
I was not able to generate a form with two columns (may be it's me ...). For example it was impossible for me to treat
differently two form fieldsets without overloading the heart of the lib.

I even tried to get the generated HTML code and then "disconnect" the form generation but it seems to be
dynamically called before each validation and cannot (at least easily) be bypassed.

So I gave up **[Backbone Forms][backbone-forms]** which I think is a very good candidate for an application that need to
dynamically generate forms but not suitable for advanced customization.

I came to look at **[Backbone Validation][backbone-validation]** and was more convinced. This lib **only focus on
validation aspects** and leaves us free to write our form. I feel much more comfortable with this approach, it does
not represent much more (probably less) work than the customization of a self-generated form and there is **no limit**.
The lib has **a very large number of built-in validators** and **provides effective validators customization and
extension mechanisms**.

**[Backbone Validation][backbone-validation]** does not neither propose automatic linking between form and model and
leaves us the choice to use a dedicated lib or to implement custom behaviour (before the validation, process all form values
to set to model). The behaviour of **[Backbone Validation][backbone-validation] perfectly matches standard
[Backbone][backbone] workflow** through `validate` and `isValid` methods.

**Model** : constraints definition:

```js
define([
    'underscore',
    'backbone',
    'backbone-validation'
], function (_, Backbone) {

    /**
     * Definition of a Participant model object
     */
    var ParticipantModel = Backbone.Model.extend({
        urlRoot:App.Config.serverRootURL + "/participant",
        defaults:{

        },

        // Defines validation options (see Backbone-Validation)
        validation:{
            firstname:{
                required:true
            },
            lastname:{
                required:true
            },
            email:{
                required:false,
                pattern:'email'
            }
        },

        initialize:function () {
        }

    });
    return ParticipantModel;

});
```

**HTML5 Form** :

```html
{{#with participant}}
    <form class="form-horizontal">
        <fieldset>
            <div class="row">
                <div class="span8">
                    <div class="control-group">
                        {{#if id}}
                            <label for="participantId" class="control-label">Id:</label>
                            <div class="controls">
                                <input id="participantId" name="id" type="text" value="{{id}}" disabled/>
                            </div>
                        {{/if}}
                    </div>

                    <div class="control-group">
                        <label for="firstname" class="control-label">First name:</label>
                        <div class="controls">
                            <input type="text" id="firstname" name="firstname" required="true" value="{{firstname}}" tabindex="1" autofocus="autofocus"/>
                            <span class="help-inline"></span>
                        </div>
                    </div>

                    <div class="control-group">
                        <label for="lastname" class="control-label">Last name:</label>
                        <div class="controls">
                            <input type="text" id="lastname" name="lastname" required="true" value="{{lastname}}" tabindex="2"/>
                            <span class="help-inline"></span>
                        </div>
                    </div>

                    <div class="control-group">
                        <label for="email" class="control-label">email address:</label>
                        <div class="controls">
                            <input type="email" id="email" name="email" value="{{email}}" tabindex="3"/>
                            <span class="help-inline"></span>
                        </div>
                    </div>

                </div>

                <div class="span3">
                    <div class="well">
                        <p class="photo">
                            {{#if pictureUrl}}
                                <img class="photo" src="{{photo_link pictureUrl}}" alt="" draggable="false"/>
                                <p hidden><img src="{{photo_link pict_min}}"/></p>
                            {{else}}
                                <img class="photo" src="/img/participants/no-photo.jpg" alt="" draggable="false"/>
                            {{/if}}
                        </p>

                        <p>To change the picture, drag a new picture from your file system onto the box above.</p>
                    </div>
                </div>
            </div>
        </fieldset>
        <input type="submit" style="display:none" value="Submit"/>
    </form>
{{/with}}
```

**View** : initialization and usage:

```js
initialize:function () {

    ...

    // allow backbone-validation view callbacks (for error display)
    Backbone.Validation.bind(this);

    ...
},

...

/**
 * Save the current participant (update or create depending of the existence of a valid model.id)
 */
saveParticipant:function () {

    // build array of form attributes to refresh model
    var attributes = {};
    this.$el.find("form input[type!='submit']").each(function (index, value) {
        attributes[value.name] = value.value;
        this.model.set(value.name, value.value);
    }.bind(this));

    // save model if it's valid, display alert otherwise
    if (this.model.isValid()) {
        this.model.save(null, {
            success:this.onSaveSuccess.bind(this),
            error:this.onSaveError.bind(this)
        });
    }
    else {
        Pubsub.publish(App.Events.ALERT_RAISED, ['Warning!', 'Fix validation errors and try again', 'alert-warning']);
    }
},
```

And finally: extend callbacks to update form with validation errors managed by **[Twitter Bootstrap][twitter-bootstrap]**

`backbone-validation.ext.js`:

```js
/**
 * Backbone Validation extension: Defines custom callbacks for valid and invalid
 * model attributes
 */
_.extend(Backbone.Validation.callbacks, {
    valid:function (view, attr, selector) {

        // find matching form input and remove error class and text if any
        var attrSelector = '[' + selector + '~=' + attr + ']';
        view.$(attrSelector).parent().parent().removeClass('error');
        view.$(attrSelector + ' + span.help-inline').text('');
    },
    invalid:function (view, attr, error, selector) {

        // find matching form input and add error class and text error
        var attrSelector = '[' + selector + '~=' + attr + ']';
        view.$(attrSelector).parent().parent().addClass('error');
        view.$(attrSelector + ' + span.help-inline').text(error);
    }
});
```

---
###Parameters support on view routing: Backbone Query Parameters

**[Backbone][backbone]** routes management allows to define permet such routes :
`"participants":"listParticipants"` and `"participants?:param":"listParticipantsParameters"`. But the native
 behaviour seems not sufficient:

- **management of an unknown number of parameters ** (ex `?page=2&filter=filter`) is not obvious
- we have to define (at least) two routes to handle calls with or without parameters without duplication
and without too much technical code

Expected behaviour was that the **map a single route to a method with an array of request parameter as optional parameter.**

**[Backbone Query Parameters][backbone-query-parameters] ** provides precisely this functionality.

With this lib, included once and for all in my main router, I could get the following result:

**router.js** :

```js
routes:{
    // Define some URL routes
    ...

    "participants":"listParticipants",

    ...
},

...

listParticipants:function (params) {
    ...
    // view creation through a generic method (cf. zombies and rendering)
    this.showView($('#content'), ParticipantListView, [params]);
},
```

Query parameters array is automatically recovered **without any further operation** and **whatever the number
of these parameters**. It can then be passed to the view constructor for initialization:

**list.js** :

```js
askedPage:1,

initialize:function (params) {

    ...

    if (params) {
        if (params.page && this.isValidPageNumber(params.page)) this.askedPage = parseInt(params.page);
    }

    ..
},
```

This lib is pretty light and really cool and, honestly, **It is an absolute must have**.

---
### List pagination : Backbone Paginator

I also search for a lib allowing me to paginate my lists. I quickly found **[Backbone Paginator][backbone-paginator]**.
The lib offers both client side pagination (`Paginator.clientPager`) and integration with server side pagination
(`Paginator.requestPager`). It includes management of filters, sorting, etc.

#### Client side pagination

This lib extends **[Backbone][backbone]** collections. So adding options to collections is necessary:

```js
var participantsCollection = Backbone.Paginator.clientPager.extend({
    model:participantModel,
    paginator_core:{
        // the type of the request (GET by default)
        type:'GET',

        // the type of reply (jsonp by default)
        dataType:'json',

        // the URL (or base URL) for the service
        url:App.Config.serverRootURL + '/participants'
    },
    paginator_ui:{
        // the lowest page index your API allows to be accessed
        firstPage:1,

        // which page should the paginator start from
        // (also, the actual page the paginator is on)
        currentPage:1,

        // how many items per page should be shown
        perPage:12,

        // a default number of total pages to query in case the API or
        // service you are using does not support providing the total
        // number of pages for us.
        // 10 as a default in case your service doesn't return the total
        totalPages:10
    },
    parse:function (response) {
        return response;
    }
});
```

We get then the collection and, as this is a client side operation, we classically `fecth` the collection and then
ask for the right page:

```js
/**
 * Render this view
 *
 * @param partials optional object containing partial views elements to render. if null, render all
 * @param selectLast optional boolean. if true select the last element after rendering
 * @return {*} the current view
 */
render:function (partials, selectLast) {

    this.initDeleted();

    // reinit collection to force refresh
    this.collection = new ParticipantsCollection();

    // get the participants collection from server
    this.collection.fetch(
        {
            success:function () {
                this.collection.goTo(this.askedPage);
                this.showTemplate(partials);
                if (selectLast) {
                    this.selectLast(this.$el, "li.thumbnail");
                }
            }.bind(this),
            error:function (collection, response) {
                Pubsub.publish(App.Events.ALERT_RAISED, ['Error!', 'An error occurred while trying to fetch participants', 'alert-error']);
            }
        });
    return this;
},
```

Once the collection retrieved, `collection.info()` allows to get information about current state:

```js
totalUnfilteredRecords
totalRecords
currentPage
perPage
totalPages
lastPage
previous
next
startRecord
endRecord
```


#### Server side pagination

Once server side pagination implemented, client adaptation is very easy:

We set **parameters to send to server** in `collections/participants.js`:

```js
server_api:{
    'page':function () {
        return this.currentPage;
    },

    'perPage':function () {
        return this.perPage;
    }
},
```

Then, in the same file, we provide a parser to get the response back and initialize collection and pager:

```js
parse:function (response) {
    var participants = response.content;
    this.totalPages = response.totalPages;
    this.totalRecords = response.totalElements;
    this.lastPage = this.totalPages;
    return participants;
}
```

Finally, we change server call : this time the `goTo` method extend `fetch` and should be called instead
(`views/participants/list.js`) :

```js
// get the participants collection from server
this.collection.goTo(this.askedPage,
    {
        success:function () {
            this.showTemplate(partials);
            if (selectLast) {
                this.selectLast(this.$el, "li.thumbnail");
            }
        }.bind(this),
        error:function () {
            Pubsub.publish(App.Events.ALERT_RAISED, ['Error!', 'An error occurred while trying to fetch participants', 'alert-error']);
        }
    });
return this;
```

All other code stay inchanged but the collection.info() is a little bit thinner:

```js
totalRecords
currentPage
perPage
totalPages
lastPage
```

---
### Asynchronous calls : Async.js

Other recurrent problem: parallel asynchronous calls for which we want to have a
final processing in order to display the results of the entire process: number of errors, successes,
etc.

Basically, each asynchronous call define a callback invoked at the end of his own treatment (success or error).
Without tools, we are thus obliged to implement a **manual count of called functions and a count
of callbacks called to compare**. The final callback is then called at the end of each call unit
but executed only if there is no more callback to call. This gives:

```js
/**
 * Effective deletion of all element ids stored in the collection
 */
deleteElements:function () {

    var self = this;
    var nbWaitingCallbacks = 0;

    $.each(this.collection, function (type, idArray) {
        $.each(idArray, function (index, currentId) {
            nbWaitingCallbacks += 1;

            $.ajax({
                url:App.Config.serverRootURL + '/participant/' + currentId,
                type:'DELETE'
            })
                .done(function () {
                    nbWaitingCallbacks -= 1;
                    self.afterRemove(nbWaitingCallbacks);
                })
                .fail(function (jqXHR) {
                    if (jqXHR.status != 404) {
                        self.recordError(type, currentId);
                    }
                    nbWaitingCallbacks -= 1;
                    self.afterRemove(nbWaitingCallbacks);
                });
        });
    });
},

/**
 * Callback called after an ajax deletion request
 *
 * @param nbWaitingCallbacks number of callbacks that we have still to wait before close request
 */
afterRemove:function (nbWaitingCallbacks) {

    // if there is still callbacks waiting, do nothing. Otherwise it means that all request have
    // been performed : we can manage global behaviours
    if (nbWaitingCallbacks == 0) {
        this.reintegrateErrors();
    }
},
```

This code work but there is **too much technical code** !

Following advice, I took a look at **[Async][async]**. This lib provides a set of helpers to perform **asynchronous
parallel processing** and synchronize the end of these treatments through a final callback called once.

This lib is initially developed for nodeJS server but has been **implemented on browser side**.

Theoretically, the method I need is `forEach`. However, I faced the following problem: all of these helpers
are designed to stop everything (and call the final callback) when the first error occurs.
But I needed to perform all my server calls and only then, whether successful or fail, return global results
to the user.

Unfortunately there is no appropriate option (despite similar requests on mailing lists) ...

So I made a little twick and used, instead of `forEach`, the `map` function that returns a result array
in which I can register successes and errors. error parameter of the final callback cannot be used without
stopping everything. So, the callback is always called with an `null` err parameter and a custom wrapper containing the
returned object and the type of the result: `success` or `error`. I can then globally count errors without
interrupting my calls:

```js
/**
 * Effective deletion of all element ids stored in the collection
 */
deleteElements:function () {

    ...

    async.map(elements, this.deleteFromServer.bind(this), this.afterRemove.bind(this));
},

deleteFromServer:function (elem, deleteCallback) {
    $.ajax({
        url:App.Config.serverRootURL +'/' + elem.type + '/' + elem.id,
        type:'DELETE'
    })
    .done(function () {
        deleteCallback(null, {type:"success", elem:elem});
    })
    .fail(function (jqXHR) {
        if (jqXHR.status == 404) {
            // element obviously already deleted from server. Ignore it and remove from local collection
            this.collection[elem.type].splice(elem.index, 1);
        }

        // callback is called with null error parameter because otherwise it breaks the
        // loop and top on first error :-(
        deleteCallback(null, {type:"error", elem:elem});
    }.bind(this));
},

/**
 * Callback called after all ajax deletion requests
 *
 * @param err always null because default behaviour break map on first error
 * @param results array of fetched models : contain null value in cas of error
 */
afterRemove:function (err, results) {

    // no more test
    ...
},
```

---
### Dispatching keyboard shortcuts: keymaster

**[Keymaster][keymaster]** is a micro library allowing to define listeners on keyboard shortcuts
and propagate them. The syntax is elegant, it is very simple but very complete:

- Management of multiple hotkeys
- Chaining through an important number of "modifiers"
- Source DOM element type filtering
- ...

It is so simple that the doc is self sufficient - this tools is a must have.

---
### CSS : LESS ?

TODO

---
Architectural considerations and questions
------------------------------------------

**[Backbone][backbone]** is more a lib than a framework and provides some tools but never **forces us adopting a given
structure or pattern**.

This means that each developer / team can (**have to**) define best practices, guidelines and patterns to organize
and structure properly a **[Backbone][backbone]** application.

These are mines but they could be incomplete (or worst ...), suggestions and reactions are welcomed.

---
### Routers usage

**[Backbone][backbone]** provides a router object allowing to manage **navigation between different views**.
Despite this, some examples does not make usage of routers and prefer delegating to each view the responsibility to
setup and initialize the next view and so on ...

I think that it is not a good practice for multiple reasons:

- We introduce a **strong coupling** between views in functional but also technical terms (life cycle management, etc..)
and the expandability of the application is greatly reduced
- We introduce **a lot of technical code** in each view to prepare next (cleaning, etc.). This technical code
is then scattered all over the application and **difficult to reuse**.
- Each view is totally dependent on the previous one: **no `deep linking`**. It is then impossible to directly get a
view by its url (in fact there is only one url : the application url). The application is not bookmarkable, cannot be
easily explored and indexed by search engine roots, etc.

Router usage:

```js
var AppRouter = Backbone.Router.extend({
    routes:{
        // Define some URL routes
        "participant/:id":"showParticipant",
        "participant/:id/edit":"editParticipant",
        '*path':'defaultAction'
    },

    defaultAction:function () {
        ...
    },

    showParticipant:function (id) {
        ...
    },

    editParticipant:function (id) {
        ...
    }
});
```

---
### Routers 'smartness'

I think that routers are necessary, that's the point but what are their responsibilities ?

I believe a router is only responsible to define application routes and bind a handler to each one.

This handler does nothing other than :

- **Create** the view relate to the current route, calling its constructor
- Ask to this view to "render" in a given container

For example:

```js
routes:{
    // Define some URL routes
    "participants":"listParticipants",
},

listParticipants:function (params) {
    this.showView($('#content'), ParticipantListView, [params]);
},
```

**This is not the router responsibility to organize other views** depending on the new rendered view as I made in a previous
version of this application:

```js
listParticipants:function (params) {
    classes.Views.HeaderView.setMenu(ParticipantsMenuView);
    classes.Views.HeaderView.selectMenuItem('element-menu');
    this.showView($('#content'), ParticipantListView, [params]);
},
```

This operation should be done by the `header` view that subscribed to a dedicated event.

**NB** : obviously, this could be done by a `main view` but I don't think that is the router responsibility

Some online examples show routers implementations that **calls business functions** from the view:

```js
list: function() {
    var list = new Collection();
    list.fetch({success: function(){
        $("#content").html(new ListView({model: list}).el);
    }});
},
```

Again, this is not the router responsibility to update view model or to manager success or errors from the server call.
I prefer a model in which the router only ask : `view.render()`.

---
### Main view or not ?

The above paragraph opens another question. Is a `Main view`, responsible for the overall application organization,
necessary ?

In my case, the existence of control and navigation views (`header`, `menu`, etc..) made me answer no to this question.
I did not feel the need to add a main view this as my `header` view was already in charge of this.

However, the answer may be different for each application but, in all cases, the responsibility should not be
left to the router (see previous §).

---
### Zombies views problem

When a **[Backbone][backbone]** create and render a new view, we are faced to the following problem:

**Each new view instance declare new bindings without disabling those of the previous one**.
We then have with multiple active instances of the same view even if only one of them is currently rendered
since they share the same `root element` and replace each other from a DOM perspective.
We not then that when the user **click on the `delete` button multiple deletion requests are generated on
server side ... **

This issue is referenced in [this excellent post](http://lostechies.com/derickbailey/2011/09/15/zombies-run-managing-page-transitions-in-backbone-apps/)

We must find a way to ensure uniqueness of a given view at a time. Several solutions exist:

- **Exclusive use of Singletons**: cf. later. This requires to logically refresh the view
implementing of a `reset` function in each one. This method will be called instead of the constructor.
**[Backbone][backbone]** views can be extended to add a such method, that is left empty and requires to be
implemented bt the developer.
- **Extension of [Backbone][backbone] views** to add a `close` method calling all existing methods:
`remove` (deletion of the DOM), `undelegateEvents`, etc.. As suggested by Derick Bailey in his post.

I preferred the second solution because it fits better, I think, in **[Backbone][backbone]** views lifecycle and conserve
standard initialization approach. Moreover, it can be proposed as a **generic extension** without adding anything into views.

I then implemented the extension (`libs/extensions/backbone.ext.js`):

```js
/**
 *  Backbone extension:
 *
 *  Defines a new function close properly cleaning current active view.
 *      - remove validation and model bindings, if any
 *      - remove PubSub bindings, if any
 *      - remove view bindings, if any
 *      - remove this.el
 */
Backbone.View.prototype.close = function () {

    // unsubscribe all PubSub events. Otherwise these events would still be launched and listened
    // and unexpected  handlers would be called conducing to perform a same action twice or more
    if (this.handlers) {
        $.each(this.handlers, function (index, value) {
            Pubsub.unsubscribe(value);
        });
    }

    // unbind all model (if exists) and validation events
    if (this.model && this.model.unbind) {
        if (Backbone.Validation) {
            Backbone.Validation.unbind(this);
        }
        this.model.unbind();
    }

    // remove html content
    this.remove();

    // unbind view events
    this.undelegateEvents();
};
```

This is, in fact, Derick Bailey extension with some additions:

- Removing of all PubSub subscriptions
- Unbinding of model related events related (not sure if this is necessary)
- Unbinding of validation callbacks

About PubSub "unsubscribe", to be able to apply a generic solution, I had to define and apply a convention in all
of my views:

```js
handlers:[],

initialize:function () {

    ...

    this.handlers.push(Pubsub.subscribe(App.Events.VIEW_CHANGED, this.onViewChanged.bind(this)));
    this.handlers.push(Pubsub.subscribe(App.Events.ADD_CALLED, this.addElement.bind(this)));
    this.handlers.push(Pubsub.subscribe(App.Events.LIST_CALLED, this.backToListElement.bind(this)));
    this.handlers.push(Pubsub.subscribe(App.Events.ECHAP_CALLED, this.backToElementHome.bind(this)));

    ...
}
```

i.e. referencing each subscription in a handlers array because pubsub unbind is only possible from the original
handler ref.

We still have to call this method each time we switch between views in router. In the current implementation, it is
necessary to store **a permanent reference** to the current main view and **close it before initializing the next
one**. This is done by a dedicated method in router:

```js
listParticipants:function (params) {
    this.showView($('#content'), ParticipantListView, [params]);
},

...

/**
 * This methods wrap initialization and rendering of main view in order to guarantee
 * that any previous main view is properly closed and unbind.
 *
 * Otherwise events and listeners are raise twice or more and the application becomes unstable
 *
 * @param $selector jquery selector in which the view has to be rendered
 * @param View View to create
 * @param args optional view constructor arguments
 * @return {Object} created View
 */
showView:function ($selector, View, args) {
    // initialize args if null
    args = args || [];

    // clean previous view
    if (App.Views.currentView) {
        App.Views.currentView.close();
    }

    // insertion of this in arguments in order to perform dynamic constructor call
    args.splice(0, 0, this);

    // call constructor and initialize view
    var view = new (Function.prototype.bind.apply(View, args));

    // render view
    $selector.html(view.render().el);

    // replace global accessor of current view
    App.Views.currentView = view;

    return view;
}
```

**NB**: It is also necessary to transitively close all nested views if any (cf. later).
**NB 2**: These mechanisms could be enhanced with an automatic detection when removing a view root element from DOM ...

---
### Nested views

A nested view is a **view that is embedded in another more global one. Its lifecycle is totally dependent and managed
by its parent view**: These views cannot exist without their parent and cannot survive to it.

In the previously described mechanism, the router only manage main views. These views are so responsible for initializing,
rendering and closing their nested views.

It is therefore necessary that each parent view properly close its nested views during its own closure. This is done
with a close method overload (don't forget to recall the original method):

```js
return Backbone.View.extend({

    ...

    initialize:function (params) {
        ...
        this.paginationView = new PaginationView();
    },

    render: function() {
        ...
        this.paginationView.render(this.collection);
        ...
    },

    /**
     * Close the current view and any of its embedded components in order
     * to unbind events and handlers that should not be triggered anymore
     */
    close:function () {

        this.paginationView.close();
        Backbone.View.prototype.close.apply(this, arguments);
    }
});
```

---
### Singleton views

Singleton views subject has been partially discussed beside but deserves some clarification.
I do consider as 'singleton view' only control views that do not require any `reset` from router
and are exclusively updated by subscribing to events generated by other views.

By definition, these views are unique throughout the application and are instantiated once and only once,
most often at startup.

In this example, they are initialized in the `app.js`:

```js
// Define global singleton views
App.Views.HeaderView = new HeaderView();
$('.header').html(App.Views.HeaderView.render().el);
App.Views.AlertsView = new AlertsView();
 $('.alerts').html(App.Views.AlertsView.render().el);
App.Views.FooterView = new FooterView();
$('footer').html(App.Views.FooterView.render().el);
App.Views.ShortcutsView = new ShortcutsView();
App.Views.KeyboardView = new KeyboardView();
```

We can see that they are added to the namespace `App.Views` ... for now without any benefit or requirement - but it
bothered me to see them disappear into the wild without the possibility of finding them later if needed :-)

More generally, regarding these specific views, the question is how to get them later and possibly how to ensure their
uniqueness by making it impossible any multiple instantiation.

I have so far adopted the doctrine of Julien Askhenas, creator of **[Backbone][backbone]** in this
[Pull Request] (https://github.com/documentcloud/backbone/pull/1299): "if you just want one year of object ... just make one."

I remain divided on this point and does not exclude to find better ...

---
### Global rendering strategy

Concerning rendering, **[Backbone][backbone] again lets us find and manage the best way to fit our specific needs**.
It is therefore necessary to define a global and comprehensive rendering strategy.

Ian Taylor Storm gives us [some ideas](http://ianstormtaylor.com/rendering-views-in-backbonejs-isnt-always-simple/).

To summarize, our strategy of rendering should allow us to fulfil following rules:

- A view should be rendered multiple times without side effects
- DOM organization and elements positioning order must be defined in templates, not in views
- Multiple calls to render must maintain view in the same state
- Multiple calls to render should not consist to delete and recreate view

These means:

- No state change: increment, etc.. in `render ()`
- Templates and general layout define the elements in which views will be rendered

For example:

```html
<div class="header"></div>

<div class="container">
    <div class="row">
        <div class="alerts span12>"></div>
    </div>

    <div class="row">
        <div id="content" class="span12>"></div>
    </div>

    <div class="modal hide" id="shortcuts"></div>

    <footer class="footer row">
    </footer>
</div>
```

It means, for example that the ** view root element (`this.el`) should not be the container element in which it has
to be rendered**. This should be avoided:

```js
new MyView($('.container'));

return Backbone.View.extend({

    initialize:function (el) {
        this.setElement(el);
    }

    ...
});
```

Indeed, in **[Backbone][backbone]** logic, `this.el` is strongly linked to its parent view. If we bypass this
mechanism, any calls to `MyView.remove()` will irreversibly remove the container and prevent any future rendering.

- Do not hard code the view container to allow render the view later and elsewhere.

This should be also avoided:

```js
new MyView().render();

return Backbone.View.extend({

  ...

  render:function () {
      $('.container').html(this.template());
      return this;
  },
});
```

With these constraints and principles and some others (let templates define order - and so avoid call directly
`appendTo` from `this.$el`) we get the following pattern:

```js
return Backbone.View.extend({

    // Cache the template function for a single item.
    template:Handlebars.compile(template),

    initialize:function () {
    },

    render:function () {
        this.$el.html(this.template());
        return this;
    }
});
```

We note that `render` returns `this` to allow inserting the generated html from an external handler (router or parent view):

```js
$('.container').html(new MyView().render().el);
```

This way, the view does not decide itself where to render but delegates this to an upper element. It is then possible to
perform multiple view rendering with no side effect (which would not be the case with a succession of `appendTo` calls).
The call to `remove` removes the element of highest level of the view (a div by default) but keeps the main container.

In our case, this is done in a generic way by the `showView` method in router (cf. above).

---
### Effective PushState management

**[Backbone][backbone]** allows `pushState` activation that permits usage of real links instead of simple anchors `#`.
PushState offers better navigation experience and better indexation and search engine ranking:

```js
Backbone.history.start({pushState:true, root:"/"});
```

`root` option allows to ask **[Backbone][backbone]** to define this path as application context;

However, **[Backbone][backbone]** stops here. Direct access to views by url works fine but, each link leads to **
a full reload**! **[Backbone][backbone]** does not intercept html links and it is necessary to implement it ourselves.

Branyen Tim, the creator of **[Backbone boilerplate][backbone-boilerplate]** proposes the following solution that
I have added to my extensions with a complementary a test to check pushState activation:

```js
// force all links to be handled by Backbone pushstate - no get will be send to server
$(document).on('click', 'a:not([data-bypass])', function (evt) {

    if (Backbone.history.options.pushState) {

        var href = this.href;
        var protocol = this.protocol + '//';
        href = href.slice(protocol.length);
        href = href.slice(href.indexOf("/") + 1);

        if (href.slice(protocol.length) !== protocol) {
            evt.preventDefault();
            Backbone.history.navigate(href, true);
        }
    }
});
```

Any click on a link will be intercepted and bound to a **[Backbone][backbone]** navigation instead. I we want to
provide external links, we still have to use the `data-bypass` attribute:

```html
<a data-bypass href="http://github.com/bmeurant/tournament-front" target="_blank">
```

---
### libs extensions

To avoid scattering libs extensions in our applicative code, extensions are isolated in a `js/libs/extensions` directory:

    |-- js
        |-- libs
            |-- extensions
                |-- backbone-validation.ext.js
                |-- backbone.ext.js
                |-- handlebars.helpers.ext.js

Extensions are loaded at startup (`app.js`):

```js
define([
    'jquery',
    'underscore',
    'backbone.ext',
    'backbone-validation.ext',
    'router',
    'views/header',
    'views/alerts',
    'views/help/shortcuts',
    'views/footer',
    'views/keyboard',
    'handlebars',
    'handlebars.helpers'
],
```

---
### Handlebars Helpers

If possible, Handlebars helpers are defined globally (in an extension) and statically loaded:

```js
Handlebars.registerHelper('ifequals', function (value1, value2, options) {

    if (value1 == value2) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});
```

However, some helpers are view-specific and must be defined not only locally but also
once instantiated and not statically (use of `this`):

```js
Handlebars.registerHelper('disabled', function (id) {
    return (this.deleted.indexOf(id) >= 0) ? 'disabled' : '';
}.bind(this));
```

---
### Mixins

Mixins are a better alternative to the definition of utility methods in a global namespace.

cf. ** [Backbone Patterns] (# http://ricostacruz.com/backbone-patterns/ mixins) **.

Views `participants/list` and `deletions/list` declare, for example, the `selectable` mixin which provides
a set of methods and behaviors to manage list items selection on keyboard:

```js
return Backbone.View.extend(
    _.extend({}, Selectable, Paginable, {

    ...

}));
```

Mixin is defined in `js/mixins/selectable`:

```js
define([
    'jquery'
], function ($) {

    return {
        /**
         * Select an element
         *
         * @param type optional selection type : 'previous' or 'next'. Otherwise or null : 'next'
         */
        selectElement:function ($el, selector, type) {
            ...
        },

        selectNext:function ($el, selector) {
            ...
        },

        selectPrevious:function ($el, selector) {
            ...
        },

        selectFirst:function ($el, selector) {
            ...
        },

        findSelected:function ($el, selector) {
            return $el.find(selector + ".selected");
        },

        ...

    };
});
```

---
### Multiple routers

Multiples routers were not yet implemented in my case but I think that is absolutely required in a large application.

TODO

---
### Internationalization ?

TODO

---
### Login / Logout & Security ?

TODO

---
### Dynamic require in routers ?

TODO

[resthubjs]: http://resthub.org/2/backbone-stack.html "Resthub js"
[underscore]: http://underscorejs.org/ "Underscore"
[handlebars]: https://github.com/wycats/handlebars.js "Handlebars"
[backbone]: http://backbonejs.org/ "Backbone"
[backbone-forms]: https://github.com/powmedia/backbone-forms "Backbone Forms"
[backbone-validation]: https://github.com/thedersen/backbone.validation "Backbone Validation"
[twitter-bootstrap]: http://twitter.github.com/bootstrap/ "Twitter Bootsrap"
[backbone-query-parameters]: https://github.com/jhudson8/backbone-query-parameters "Backbone Query Parameters"
[backbone-paginator]: http://addyosmani.github.com/backbone.paginator/ "Backbone Paginator"
[async]: https://github.com/caolan/async/ "Async"
[backbone-boilerplate]: https://github.com/tbranyen/backbone-boilerplate "Backbone boilerplate"
[keymaster]: https://github.com/madrobby/keymaster "keymaster"
