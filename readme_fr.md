
Tournament-front
================

Ce projet est une **application exemple** basée sur **[Resthub js][resthubjs]**.


A travers cette application j'ai cherché à adresser les questions suivantes :

- Comment organiser ses vues ?
- Quelle stratégie de rendering ?
- Comment gérer la navigation entre de multiples vues ?
- Comment mettre en place du deep linking ?
- Comment définir plusieurs routeurs et leur contenu ?
- etc.

Cette application exemple devrait fonctionnellement permettre de créer, gérer et planifier des tournois et des jeux
constitués de participants et/ou d'équipes et reposant sur un ensemble de règles définies dynamiquement.

---
Outils complémentaires
----------------------

En plus des outils standards embarqués par **[Resthub js][resthubjs]**, j'ai progressivement ajouté des libs et frameworks complémentaires
pour répondre à des besoins particuliers.

**Question** : Ces outils peuvent-ils / doivent-ils être intégrés à la stack **[Resthub js][resthubjs]** ?

Ces outils sont les suivants :

- **Moteur de template : [Handlebars][handlebars]**
- **Validation de formulaire : [Backbone Validation][backbone-validation]**
- **Support des paramètres pour les vues : [Backbone Query Parameters][backbone-query-parameters]**
- **Pagination de liste : [Backbone Paginator][backbone-paginator]**
- **Liste d'appels asynchrones : [Async][async]**
- **Dispatch de raccourcis clavier : [keymaster][keymaster]**

---
### Moteur de template : Handlebars

Le moteur de template par défaut est fournit par **[Underscore js][underscore]** qui embarque du micro templating javascript
combiné aux helpers underscore. Il repose sur une syntaxe à la JSP :

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

Cela peut paraître initialement simple je ne trouve **vraiment pas ça très élégant** car cela conduit rapidement à **déplacer une bonne
partie de la logique de la vue vers le template** et rend très difficile la réutilisation de ces templates.

Je suis donc rapidement passé à un **moteur de template logic-less**, en l'occurrence **[Handlebars][handlebars]**.

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

... Ça a quand même plus de gueule :-)

Évidemment, cette opération a nécessité de définir des **Helpers [Handlebars][handlebars]** afin d'implémenter, au sein de la vue,
la logique qui n'est plus dans le template.

Dans notre exemple :

- Ajouter la classe css `selected` si nécessaire
- Ajouter la classe css `disabled` si nécessaire
- Déterminer si l'élément courant est en cours de suppression
- Afficher un lien personnalisé pour la photo

**Helpers spécifiques à la vue**:

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

**Helpers globaux (`handlebars-helpers.js`) :**

    initialize:function () {

        ...

        Handlebars.registerHelper('photo_link', function (pictureUrl) {
            return App.Config.serverRootURL + pictureUrl;
        });

        ...
    }

Le fait d'avoir à définir ces templates peut paraître un peu rébarbatif au départ mais la syntaxe est autrement plus
élégante, la majorité des helpers sont réutilisables et en réfléchissant un peu on réduit très facilement la quantité
de code d'intégration.

Et **la logique a réellement été déplacée dans la vue**, ce qui est sa juste place et va nous faciliter grandement la
maintenance et la réutilisation.

---
### Validation de formulaire : Backbone Validation

**[Backbone][backbone]** ne fournit **aucun outillage pour la gestion de formulaires ou leur validation**. Les attributs du
modèle n'ont pas à être précisés, encore moins leur format ou les contraintes qui leur sont liées.

En termes de validation, **[Backbone][backbone]** fournit seulement des méthodes vides `validate` et `isValid` qui peuvent
être implémentées par chaque développeur. La seule garantie est que la méthode `validate` est appelée avant un `save`
qu'elle empêche en cas d'erreur. Et encore ... la validation d'un formulaire complet n'est pas évidente (gestion
d'un tableau d'erreur custom ... ) et les erreurs ne sont pas dissociées des erreurs propres à la méthode `save`.

Comme un solide gestionnaire de validation me parait indispensable, j'ai cherché un outil adapté selon les critères
suivants :

- facile à utiliser et à comprendre (KISS)
- **facile à personnaliser et à étendre**
- possibilité de gérer des **formulaires complexes**
- un ensemble de validateurs built-in conséquent
- compatible html5
- compatible **[Twitter Bootstrap][twitter-bootstrap]**

J'ai commencé par tester **[Backbone Forms][backbone-forms]** qui semble un très bon outil. Mais il est en fait composé de deux parties :
**la logique de validation et un outil complet de génération dynamique de formulaire**. On fournit juste la description
des champs du model avec leurs contraintes et le formulaire est auto généré.

Cela peut sembler prometteur (même si je ne suis pas fan de ces approches 'scaffolding' et encore moins lorsqu'elles sont
dynamiques). Mais le problème c'est que ces deux outils sont indissociables et qu'en essayant de customiser mon formulaire
j'ai atteint très rapidement les limites de la personnalisation : Je n'ai pas pu générer un formulaire sur deux colonnes
(peut-être possible mais très compliqué). Il est par exemple rigoureusement impossible de traiter deux fieldsets du même
formulaire de manière différente sans surcharger le coeur de la lib.

J'ai même essayé de récupérer le code généré pour "débrancher" ensuite la génération mais celle-ci semble se faire
dynamiquement avant chaque validation et ne peut pas (en tout cas facilement) être "bypassée".

**J'ai donc abandonné [Backbone Forms][backbone-forms]** qui me paraît un très bon candidat pour une application devant être capable de
générer des formulaires dynamiquement mais pas du tout adapté à une personnalisation avancée.

Je me suis donc tourné vers **[Backbone Validation][backbone-validation]** qui m'a bien plus convaincu. Cette lib se concentre en effet **uniquement
sur l'aspect validation** et nous laisse la main libre sur le formulaire. Cette approche me convient bien mieux, ne représente
au final pas plus de travail que la customisation d'un formulaire auto-généré (voire moins) et n'impose **aucune limite**.
La lib dispose d'un **nombre très important de validateurs built-in** et propose des **mécanismes de personnalisation et
d'extension** de validateurs efficaces.

**[Backbone Validation][backbone-validation]** ne propose pas non plus de lien automatique entre le formulaire et le modèle et nous laisse le choix
d'utiliser une lib dédiée ou d'implémenter nous, avant la validation, le traitement qui va récupérer les valeurs du formulaire
pour les setter au modèle. Le fonctionnement de **[Backbone Validation][backbone-validation]** **s'inscrit parfaitement dans le workflow standard
de** **[Backbone][backbone]** via les méthodes `validate` et `is valid`.

**Model** : définition des contraintes:

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

** Formulaire HTML5** :

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


**Vue** : initialisation et utilisation :

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
            Pubsub.publish(App.Events.ALERT_RAISED, [messages.warning, 'Fix validation errors and try again', 'alert-warning']);
        }
    },

Et enfin, globalement, extension des callbacks pour mise à jour des erreurs de validation pour un formulaire avec **[Twitter Bootstrap][twitter-bootstrap]**

backbone-validation.ext.js:

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

---
###Support des paramètres pour les vues  : Backbone Query Parameters

Lorsque j'ai souhaité ajouter un paramètre à ma vue liste sous la forme `participants?page=2` j'ai été confronté
au problème suivant : la gestion des routes **[Backbone][backbone]** permet de définir les routes
`"participants":"listParticipants"` et `"participants?:param":"listParticipantsParameters"`. Cependant le
fonctionnement standard me semble insuffisant :

- la **gestion d'un nombre de paramètres inconnu** (type `?page=2&filter=filtre`) n'est pas évidente
- il est nécessaire de définir (au moins) 2 routes pour gérer les appels avec ou sans paramètres sans duplication
  et sans trop de code d'intégration

Le fonctionnement que j'attendais était plutôt la **définition d'une unique route vers une méthode prenant en
paramètre optionnel un tableau des paramètres de requêtes**.

La librairie **[Backbone Query Parameters][backbone-query-parameters]** fournit justement ce fonctionnel ainsi qu'un gestionnaire d'expressions
régulière applicable à la gestion des routes.

Grâce à cette lib, incluse une fois pour toute dans mon router principal, j'ai pu obtenir le résultat suivant :

**router.js** :

    routes:{
        // Define some URL routes
        ...

        "participants":"listParticipants",

        ...
    },

    ...

    listParticipants:function (params) {
        ...
        // création de la vue via une fonction générique (cf. gestion des zombies et rendering)
        // le constructeur de la vue prend un paramètre params
        this.showView($('#content'), ParticipantListView, [params]);
    },

Ainsi, le tableau des paramètres de requête est récupéré automatiquement sans **aucun traitement supplémentaire** et
ce, **quelque soit le nombre de ces paramètres**. Il peut ensuite être passé au constructeur de la vue pour
initialisation :

**list.js** :

    askedPage:1,

    initialize:function (params) {

        ...

        if (params) {
            if (params.page && this.isValidPageNumber(params.page)) this.askedPage = parseInt(params.page);
        }

        ..
    },

Cette lib est assez légère et bien foutue et, franchement, **je vois mal comment se passer du fonctionnel qu'elle
propose**.

---
### Pagination de liste : Backbone Paginator

J'ai également cherché une lib qui me permette de proposer une pagination de mes listes. Je suis très vite tombé
sur **[Backbone Paginator][backbone-paginator]**. La lib  propose des
mécanismes de pagination coté client (`Paginator.clientPager`) ou de se brancher sur une api
server paginée (`Paginator.requestPager`). La configuration de ces objets et très complète : gestion de filtres,
d'ordre, etc.

#### Pagination côté client

Cette lib repose sur l'**extension des collections [Backbone][backbone]**. Il faut donc ajouter les options
nécessaires à la collection :

    var participantsCollection = Backbone.Paginator.clientPager.extend({
        model:participantModel,
        paginator_core:{
            // the type of the request (GET by default)
            type:'GET',

            // the type of reply (jsonp by default)
            dataType:'json',

            // the URL (or base URL) for the service
            url:App.Config.serverRootURL + '/participant'
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

On récupère ensuite la collection de manière classique : s'agissant d'un pagination client on exécute un
fetch complet puis on choisit la page courante :

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
                    Pubsub.publish(App.Events.ALERT_RAISED, [messages.error, 'An error occurred while trying to fetch participants', 'alert-error']);
                }
            });
        return this;
    },

A noter q'une fois la collection récupérée `collection.info()` permet d'obtenir tout un tas d'information sur
l'état courant de la collection :

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


Cette lib me convient donc tout à fait et se montre efficace, intuitive et simple d'utilisation pour le moment.

#### Pagination côté serveur

Une fois la pagination côté serveur implémentée, l'adaptation est très facile :

On renseigne les **paramètres à envoyer au server** dans la collection `collections/participants.js` :

    server_api:{
        'page':function () {
            return this.currentPage;
        },

        'perPage':function () {
            return this.perPage;
        }
    },

Puis, dans le même fichier, on implémente le parser pour récupérer la réponse et initialiser la collection et le pager :

    parse:function (response) {
        var participants = response.content;
        this.totalPages = response.totalPages;
        this.totalRecords = response.totalElements;
        this.lastPage = this.totalPages;
        return participants;
    }

Et enfin, on modifie l'appel au serveur : cette fois, la méthode `goTo()` étend `fecth` et doit donc être appelée à sa
place et non à son retour (`views/participants/list.js`) :

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
                Pubsub.publish(App.Events.ALERT_RAISED, [messages.error, 'An error occurred while trying to fetch participants', 'alert-error']);
            }
        });
    return this;

Le reste est inchangé si ce n'est le collection.info() qui dispose de moins d'éléments :

    totalRecords
    currentPage
    perPage
    totalPages
    lastPage
    // ces deux là ne sont originellement pas présents mais une pull-request est en attente
    previous
    next

---
### Liste d'appels asynchrones : Async.js

Autre problématique récurrente : les appels asynchrones successifs pour lesquels on souhaite disposer d'un
traitement final permettant d'afficher le résultat de l'ensemble des appels : nombre d'erreurs, tous successfull,
etc.

Basiquement, chaque appel asynchrone dispose d'un callback appelé à la fin de son traitement propre (succès ou erreur).
Sans outillage, on est donc obligé de mettre en place un **comptage manuel des fonctions appelées et un décompte lors
de l'appel du callback de chacune d'entre elles**. Le callback final est alors appelé à la fin de chaque appel unitaire
mais ne s'exécute que si plus aucun callback ne reste à appeler. Cela donne :

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

C'est fonctionnel mais c'est quand même ** beaucoup de code technique** !!!

Suite à des conseils avisés, je me suis donc intéressé à la lib **[Async][async]**. Cette lib propose un ensemble de
helpers pour effectuer des **traitements asynchrone en parallèle** et resynchroniser la fin de ces traitements via un callback
final.

Cette lib est initialement destinée à un server nodeJs mais est également **implémentée côté browser**.

Sur le papier, la méthode dont j'avais besoin était le `forEach`. Je me suis cependant rapidement confronté au problème
suivant : tous les helpers de cette lib sont conçus pour tout arrêter (et passer au callback final) à la première erreur.
Or j'avais besoin d'exécuter toutes mes fonctions puis, qu'elles aient réussi ou échouer, de dresser un bilan à remonter
à l'utilisateur.

Il n'existe malheureusement aucune option dans cette lib ni dans une autre (à ma connaissance) qui implémente cette
fonctionnalité (malgré des demandes similaires sur les mailings lists) ...

J'ai donc du twicker un peu et utiliser, en lieu et place du `forEach`, la fonction `map` qui renvoie, elle, un tableau
de résultats dans lequel je peux enregistrer les succès. Le paramètre error du callback final ne peut être utilisé sous
peine de voir l'ensemble des appels stoppé. Le callback est donc systématiquement appelé avec un paramètre err à `null`
et un wrapper de l'objet associé à un type `success`ou `error`. Je peux ainsi en déduire le nombre d'erreurs sans pour autant
interrompre mes traitements :

    /**
     * Effective deletion of all element ids stored in the collection
     */
    deleteElements:function () {

        ...

        async.map(elements, this.deleteFromServer.bind(this), this.afterRemove.bind(this));
    },

    deleteFromServer:function (elem, deleteCallback) {
        $.ajax({
            url:App.Config.serverRootURL + '/' + elem.type + '/' + elem.id,
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

Le code est ainsi **beaucoup plus élégant, avec beaucoup moins de code technique**.

Ainsi, malgré ce twick bien dommage, **je retiens quand même cette lib pour tout ce qui concerne un empilement d'appels
asynchrone à paralléliser** - que l'on souhaite ou non disposer d'un callback final.

---
### Dispatch de reccourcis clavier : keymaster

**[keymaster][keymaster]** est une micro librairie permettant de définir des listeners sur des raccourcis clavier
et de les propager. La syntaxe est élégante, elle est très simple et fonctionnellement très complète :

- gestion de multiples touches spéciales
- chainages divers au travers d'un nombre importants de "modifieurs"
- filtrage sur certains éléments source
- ...

Elle est tellement micro que la doc parle d'elle même mais ca me semble un must pour toute application avec raccourcis
clavier.

---
### CSS : LESS ?

TODO

---
Considérations d'architecture et questions ouvertes
---------------------------------------------------

**[Backbone][backbone]** est une lib plus qu'un framework et propose un certain nombre d'outils **sans jamais imposer ni
même parfois proposer de cadre** en termes d'architecture et de design de l'application.

Il me semble donc indispensable d'explorer les différentes façons d'adresser ces problématiques d'en dégager ensuite
des guidelines et bonnes pratiques pour l'utilisation et l'organisation d'une application avec **[Backbone][backbone]**.

Un certain nombre de **questions restent ouvertes** sans solution pleinement satisfaisante et
nécessitent pour certaines, une meilleure compréhension de ma part des mécanismes sous-jacents de ces libs et
notamment de **[Backbone][backbone]**.

Alternatives, propositions et discussions sont bien évidemment bienvenues.

---
### Utilisation de routeurs

**[Backbone][backbone]** fournit un objet routeur permettant d'**organiser la navigation entre les différentes vues** de
l'application. Malgré cela certains exemples n'en font pas uage et préfèrent déléguer à chaque vue la responsabilité
de passer la main à la suivante, de l'initialiser, etc.

Il me semble que cet usage est à déconseiller pour plusieurs raisons :

- On introduit un **couplage fort** entre les vues en termes fonctionnels mais aussi techniques (gestion du cycle de vie, etc.)
  L'évolutivité de l'application en est fortement réduite
- On introduit **beaucoup de code technique** dans chaque vue pour préparer la suivante, se 'nettoyer', etc. ce code
  technique se trouve alors éparpillé dans l'application et est **difficilement capitalisable**
- L'affichage de chaque vue est totalement dépendante de la précédente : **pas de `deep-linking`**. Autrement dit il est
  impossible d'accéder directement à une vue par son url et il n'existe q'une url : celle de l'application

Pour toutes ces raison (et sûrement des tas d'autres), les routeurs **[Backbone][backbone]** doivent être utilisés pour
naviguer entre les vues :

    var AppRouter = Backbone.Router.extend({
        routes:{
            // Define some URL routes
            '*path':'defaultAction'
        },

        defaultAction:function () {
            this.navigate("participants", true);
        }
    });

---
### 'Intelligence' des routeurs

Une fois que l'on a dit que l'utilisation des routeurs était à privilégier, reste à identifier précisément leur
responsabilité.

Le routeur définit les différentes routes de l'application et associe à chacune d'elle un traitement.

De mon point de vue, ce traitement doit se résumer strictement à :

- **Créer** la vue associée à la route en se contentant d'appeler son constructeur avec d'éventuels paramètres
- Demander à cette vue de **s'afficher** dans un conteneur donné

Par exemple:

    routes:{
        // Define some URL routes
        "participants":"listParticipants",
    },

    listParticipants:function (params) {
        this.showView($('#content'), ParticipantListView, [params]);
    },

**Ce n'est pas au routeur d'organiser les autres vues** si elles existe en fonction de la nouvelle vue créée comme j'avais
pu le faire dans une précédente version :

    listParticipants:function (params) {
        classes.Views.HeaderView.setMenu(ParticipantsMenuView);
        classes.Views.HeaderView.selectMenuItem('element-menu');
        this.showView($('#content'), ParticipantListView, [params]);
    },

Cette opération doit être effectuée la vue `header` abonnée à un évènement de changement de vue.

**NB** : évidemment, si il n'existe dans l'application aucune vue `header`en charge de ces opérations, cela peut
être effectuée par une `main view` mais je ne pense pas que cela soit pertinent dans le routeur.

Certains exemples en ligne proposent des implémentations de routeurs **appelant des fonction "métier" de la vue** à
afficher :

    list: function() {
        var list = new Collection();
        list.fetch({success: function(){
            $("#content").html(new ListView({model: list}).el);
        }});
        this.headerView.selectMenuItem('list-menu');
    },

Même si dans cet exemple le routeur effectue peu d'opérations, ce n'est à mon sens pas à lui de demander à la vue de
mettre à jour son model, de gérer les success et errors de l'appel au serveur, etc. Je préfère un modèle ou **le routeur
se contente de lui demander de se rendre** ...

---
### Main view or not ?

Le NB ci-dessus ouvre une autre question. Faut-il une `Main view` globale en charge de l'ensemble de l'organisation de l'application ?

Dans mon cas, l'organisation de mes différentes vues et la présences de vues annexes de contrôle et de navigation :
`header`, `menu`, etc. m'a fait répondre à cette question par la négative : je n'ai pas éprouvé le besoin d'ajouter
cette vue principale puisque ma vue `header`, notamment se chargeait déjà des adaptations en questions.

Cependant, la réponse peut-être différente selon les applications et, dans tous les cas, une vue doit se charger de ces
opérations qui ne doivent pas être laissées au routeur (cf. § précédent).

En particulier, dans cette application, j'ai du créer une vue `footer` pour gérer les évènements sur les boutons d'aide
(dont un en fenêtre modale) et une `KeyboardView` pour centraliser les évènements clavier sur le document. Deux
éléments qui auraient pu être traités par une vue principale ... sujet ouvert, donc ...

---
### Le problème des vues zombies

Lorsqu'on travaille avec un routeur **[Backbone][backbone]**, celui-ci est classiquement an charge d'instancier et
de demander à la vue associée à la route appelée de se rendre (voir plus haut). On est alors confronté au problème
suivant :

**Chaque nouvelle instanciation d'une vue déclare de nouveaux bindings sans pour autant que les précédents soient
désactivés**. On se retrouve donc avec de multiples instances active d'une même vue même si une seule d'entre elles est
rendue puisqu'elles partagent le même `root element` et se remplacent donc les unes les autres d'un point de vue DOM.
Il est alors perturbant de constater qu'**un click sur le bouton `delete` génère plusieurs requêtes de suppression sur le
serveur** ...

Ce problème est référencé dans [ce très bon post](http://lostechies.com/derickbailey/2011/09/15/zombies-run-managing-page-transitions-in-backbone-apps/)

On doit alors trouver un moyen de garantir l'unicité d'une vue donnée à un instant t. Plusieurs solutions pour cela :

- **Utilisation exclusive de Singletons** : cf. plus loin. Cela nécessite de mettre en place une logique de
rafraîchissement de la vue via l'implémentation d'une fonction `reset` dans chacune d'entre elles qui sera appelée
en lieu et place du constructeur. Les vues **[Backbone][backbone]** peuvent être étendues pour ajouter la signature
ce cette méthode, laissée vide pour une implémentation spécifique par vue.
- **Extension des vues [Backbone][backbone]** pour ajouter une méthode `close` chargée d'appeler les méthodes déjà
présentes : `remove` (suppression du DOM), `unbind`, etc. Comme le suggère Derick Bailey dans son post.

La seconde solution m'a parue préférable parce qu'elle s'intègre mieux, je trouve, dans le cycle de vie des vues
**[Backbone][backbone]**, conserve l'approche standard d'initialisation et peut être proposée sous forme d'extension
générique sans ajouter quoique ce soit aux vues.

J'ai donc implémenté l'extension suivante (`libs/extensions/backbone.ext.js`) :

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
            this.unbind();

            // optionally call a close method if exists
            if (this.onClose) {
                this.onClose();
            }
        };

Il s'agit de l'implémentation proposée par Derick Bailey à laquelle j'ai apporté les modifications suivantes :

- Suppression de toutes les souscriptions Pubsub qui provoquent le même effet
- unbind des évènements liés au model (pas sûr que cela soit nécessaire)
- unbind des callbacks de validation

Concernant le "unsubscribe" Pubsub, pour pouvoir appliquer une solution générique j'ai du appliquer la convention
suivante dans l'ensemble de mes vues :

    handlers:[],

    initialize:function () {

        ...

        this.handlers.push(Pubsub.subscribe(App.Events.VIEW_CHANGED, this.onViewChanged.bind(this)));
        this.handlers.push(Pubsub.subscribe(App.Events.ADD_CALLED, this.addElement.bind(this)));
        this.handlers.push(Pubsub.subscribe(App.Events.LIST_CALLED, this.backToListElement.bind(this)));
        this.handlers.push(Pubsub.subscribe(App.Events.ECHAP_CALLED, this.backToElementHome.bind(this)));

        ...
    }

Soit le référencement de chaque souscription dans un tableau de handlers, puisque Pubsub ne permet un unbind qu'à
partir d'un handler donné.

Reste à appeler cette méthode close à chaque changement de vue dans le routeur. Pour cela il est nécessaire de
stocker en permanence une **référence vers la vue active et de la clore avant d'en initialiser une nouvelle** via
une méthode unique dédiée dans notre routeur :

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

A noter qu'il est également nécessaire de s'occuper transitivement des "Sous vues" si elles existent (cf. plus loin).

---
### Sous vues

Une sous vue est une **vue embarquée dans une vue de plus haut niveau et dont le cycle de vie est totalement inféodé à celui
de son parent** : elles n'existent que pendant la durée de l'existence du parent et ne peuvent lui survivre.

Dans le système décrit précédemment, seules sont gérées par le routeur les vues principales, charge à elles d'initialiser,
rendre et donc de clore également les vues qu'elles embarquent.

Il est donc nécessaire pour chaque vue comportant des sous vues, que la vue parente les ferment proprement à sa propre
fermeture, via une surcharge de la méthode close (sans oublier de rappeler la méthode originelle) :

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

De cette manière, les sous vues sont également fermées correctement.

---
### Vues Singleton

Le sujet des vues Singletons a déjà été en partie abordé plus haut mais mérite quelques précisions.
Je ne considère comme 'vue singleton' que les vues de contrôle qui ne nécessitent donc aucun `reset` depuis le
controller et se mettent à jour en souscrivant aux évènements générés par les autres vues.

Par définition, ces vues sont uniques sur toute l'application et ne sont instanciées qu'une seule et unique fois,
le plus souvent au démarrage.

Dans cet exemple, elles sont initialisé dans le fichier `app.js` :

    // Define global singleton views
    App.Views.HeaderView = new HeaderView();
    $('.header').html(App.Views.HeaderView.render().el);
    App.Views.AlertsView = new AlertsView();
     $('.alerts').html(App.Views.AlertsView.render().el);
    App.Views.FooterView = new FooterView();
    $('footer').html(App.Views.FooterView.render().el);
    App.Views.ShortcutsView = new ShortcutsView();
    App.Views.KeyboardView = new KeyboardView();

On constate qu'elles sont ajoutées au namespace `App.Views` ... pour l'instant sans utilité aucune - simplement, cela
me gênait de les voir disparaître dans la nature sans possibilité de les retrouver si besoin :-)

Plus globalement, concernant ces vues spécifiques, se pose la question justement de la manière d'y accéder et
éventuellement de la manière de garantir leur unicité en rendant impossible leur instanciation ultérieure.

J'ai pour l'instant adopté la doctrine de Julien Askhenas, le créateur de **[Backbone][backbone]** dans cette
[Pull Request](https://github.com/documentcloud/backbone/pull/1299) : "if you just want one of an object ... just make one".
Je ne les ai donc créé qu'une seule fois :-)

Je reste partagé sur ce point et n'exclue pas de trouver mieux ...

---
### Stratégie globale et cohérente de rendering

Concernant la manière de rendre les vues, ici encore **[Backbone][backbone] nous laisse nous débrouiller** et trouver
la meilleure façon de le faire pour notre besoin. Il est donc nécessaire de définir une stratégie globale de rendering
à appliquer de manière systématique sous peine de créer une nouvelle manière à chaque vue ...

Pour cela, Ian Storm Taylor nous donne [quelques pistes](http://ianstormtaylor.com/rendering-views-in-backbonejs-isnt-always-simple/).

En résumé notre stratégie de rendering doit nous permettre de respecter les principes suivants :

- Une vue doit pouvoir être rendue plusieurs fois de suite sans effet de bord
- L'organisation du DOM et l'ordre de positionnement des éléments doit être définit dans les templates et pas dans les vues
- Appeler plusieurs fois render doit maintenir la vue dans le même état
- Rendre plusieurs fois une vue ne doit pas consister à la supprimer et la recréer

Ces différents principes nous amènent à certaines conclusions :

- Pas de changement d'état : incrément, etc. dans une fonction `render()`
- Ce sont les templates et le layout général qui définissent les éléments dans lesquels les vues seront rendues :

Par exemple :

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

En particulier, cela signifie qu'il ne faut **en aucun cas que l'élément root de la vue (`this.el`) soit l'élément
dans lequel la vue doit se rendre** mais simplement le conteneur de plus haut niveau de cette vue.

Ce qui signifie que ceci n'est pas souhaitable :

    new MyView($('.container'));

    return Backbone.View.extend({

        initialize:function (el) {
            this.setElement(el);
        }

        ...
    });

En effet, dans la logique **[Backbone][backbone]**, le `this.el` est inféodé à la vue qui le crée et le supprime. Si
l'on détourne ce mécanisme, tout appel à `MyView.remove()` supprimera de manière irrémédiable le container et empêchera
tout rendering futur.

- Ne pas stocker en dur le container dans lequel la vue sera rendue pour permettre de la rendre ailleurs.

Ce qui signifie qu'il est préférable éviter :

    new MyView().render();

    return Backbone.View.extend({

      ...

      render:function () {
          $('.container').html(this.template());
          return this;
      },
    });

Avec ces différentes contraintes et quelques autres (notamment le fait de laisser le soin aux templates) de définir
l'ordre (et donc d'éviter de faire de `appendTo` directement dans `this.$el`), on obtient le pattern, suivant :

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

On remarque que la méthode `render` retourne `this` de manière à ce que l'on puisse ensuite insérer le html de cette
manière depuis l'extérieur de la vue (le routeur ou une vue parent) :

    $('.container').html(new MyView().render().el);

De cette manière ce n'est pas la vue qui décide ou se rendre mais un élément de plus haut niveau, il est possible de la
rendre plusieurs fois sans effet indésirable (ce qui ne serait pas le cas avec une succession de `appendTo`) et l'appel
à la méthode `remove` supprime l'élément de plus haut niveau de la vue (par défaut une div) mais pas le conteneur principal.

Dans notre cas, cette opération est effectuée de manière générique dans la méthode `showView` du routeur (cf.plus haut).

---
### Gestion effective du PushState

**[Backbone][backbone]** permet d'activer le `pushState` et donc de permettre d'utiliser de vrais liens et non uniquement
des ancres `#` ce qui est bien mieux pour la navigation et indispensable au référencement et à l'indexation de l'application :

    Backbone.history.start({pushState:true, root:"/"});

L'option `root` permet de demander à  **[Backbone][backbone]** d'ajouter systématiquement ce path comme contexte de l'application.

Cependant, **[Backbone][backbone]** s'arrête ici et si l'accès direct aux vues par leur url fonctionne, **chaque lien provoque
un rechargement complet de l'application** ! **[Backbone][backbone]** n'intercepte en effet pas les lien html et il est nécessaire
de l'implémenter soi-même.

Tim Branyen, le créateur de **[Backbone boilerplate][backbone-boilerplate]** propose la solution suivante que j'ai intégré à mes
extensions **[Backbone][backbone]** en y ajoutant un test pour vérifier l'activation du pushState :

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

Ainsi chaque click sur un lien sera intercepté et effectuera une navigation **[Backbone][backbone]** plutôt qu'un rechargement.
Si l'on souhaite faire des liens externes, il suffit d'utiliser l'attribut `data-bypass` comme ceci :

    <a data-bypass href="http://bitbucket.org/bmeurant/tournament-front" target="_blank">

---
### Extension des libs

Pour ne pas surcharger le code d'extensions en vrac pour les libs utilisées, ces extensions sont isolées et placées dans
un répertoire `js/libs/extensions` :

    |-- js
        |-- libs
            |-- extensions
                |-- backbone-validation.ext.js
                |-- backbone.ext.js
                |-- handlebars.helpers.ext.js

Les extensions sont chargées au démarrage de l'application (`app.js`) :

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

---
### Helpers Handlebars

Dans la mesure du possible, les helpers Handlebars sont définis globalement (dans une extension) et chargés statiquement :

    Handlebars.registerHelper('ifequals', function (value1, value2, options) {

        if (value1 == value2) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });

Cependant, certains helpers sont spécifiques à une vue et doivent être non seulement définis dans cette vue mais également
lors de son instanciation et non de manière statique (utilisation du `this`) :

    Handlebars.registerHelper('disabled', function (id) {
        return (this.deleted.indexOf(id) >= 0) ? 'disabled' : '';
    }.bind(this));

---
### Mixins

Les mixins remplacent avantageusement la définition de méthodes utilitaires au sein d'un namespace global.

cf. **[Backbone Patterns](http://ricostacruz.com/backbone-patterns/#mixins)**.

Les vues `participant/list` et `deletions/list` déclarent par exemple tous les deux le mixin `selectable` qui fournit
un ensemble de méthodes et de comportements permettant de gérer la sélection d'un élément de liste :

    return Backbone.View.extend(
        _.extend({}, Selectable, Paginable, {

        ...

    }));

Le mixin est définit dans `js/mixins/selectable` :

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

---
### Routeurs multiples

Cette question reste à adresser dans mon cas mais cela me parait indispensable dans le cas d'une application de taille
importante.

TODO

---
### Internationalisation ?

TODO

---
### Login / Logout & Sécurisation ?

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
