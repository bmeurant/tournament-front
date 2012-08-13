
Tournament-front
================

Ce projet est une **application exemple** basée sur **[Resthub js][resthubjs]**.


A travers cette application j'ai cherché à adresser els questions suivantes :

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

Cela peut paraître initialement simple je ne trouve **vraiment pas ça très élégant** car cela conduit rapidement à **déplacer une bonne
partie de la logique de la vue vers le template** et rend très difficile la réutilisation de ces templates.

Je suis donc rapidement passé à un **moteur de template logic-less**, en l'occurrence **[Handlebars][handlebars]**.

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

        Handlebars.registerHelper('photo_link', function (picture_url) {
            return "http://localhost:3000/api" + picture_url;
        });

        ...
    }

Le fait d'avoir à définir ces templates peut paraître un peu rébarbatif au départ mais la syntaxe est autrement plus
élégante, la majorité des helpers sont réutilisables et en réfléchissant un peu on réduit très facilement le
boilerplate.

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
            urlRoot:"http://localhost:3000/api/participant",
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
                                {{#if picture_url}}
                                    <img class="photo" src="{{photo_link picture_url}}" alt="" draggable="false"/>
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
            Pubsub.publish(App.Events.ALERT_RAISED, ['Warning!', 'Fix validation errors and try again', 'alert-warning']);
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
  et sans trop de boilerplate

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

J'ai pour le moment mis en place la pagination côté client en attendant une api paginée sur mon server :

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
            url:'http://localhost:3000/api/participants'
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
     * @return {*} the current view
     */
    render:function (partials) {

        this.initDeleted();

        // reinit collection to force refresh
        this.collection = new ParticipantsCollection();

        // get the participants collection from server
        this.collection.fetch(
            {
                success:function () {
                    this.collection.goTo(this.askedPage);
                    this.showTemplate(partials);
                }.bind(this),
                error:function (collection, response) {
                    Pubsub.publish(App.Events.ALERT_RAISED, ['Error!', 'An error occurred while trying to fetch participants', 'alert-error']);
                }
            });
        return this;
    },

A noter q'une fois la collection récupérée `collection.info()` permet d'obtenir tout un tas d'information sur
l'état courant de la collection :

    info = {
        totalUnfilteredRecords:self.origModels.length,
        totalRecords:totalRecords,
        currentPage:self.currentPage,
        perPage:this.perPage,
        totalPages:totalPages,
        lastPage:totalPages,
        previous:false,
        next:false,
        startRecord:totalRecords === 0 ? 0 : (self.currentPage - 1) * this.perPage + 1,
        endRecord:Math.min(totalRecords, self.currentPage * this.perPage)
    };


Cette lib me convient donc tout à fait et se montre efficace, intuitive et simple d'utilisation pour le moment.

L'étape suivante consistera à implémenter une api de pagination côté server et mettre en place un requestPager en
lieu et place du clientPager puis à ajouter des fonctionnalités de filtrage des requêtes afin de tester le
comportement de l'outil et sa pertinence sur ce type de besoins.

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
                    url:'http://localhost:3000/api/participant/' + currentId,
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

C'est fonctionnel mais c'est quand même ** beaucoup de boilerplate** !!!

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
            url:'http://localhost:3000/api/' + elem.type + '/' + elem.id,
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

Le code est ainsi **beaucoup plus élégant, avec beaucoup moins de boilerplate**.

Ainsi, malgré ce twick bien dommage, **je retiens quand même cette lib pour tout ce qui concerne un empilement d'appels
asynchrone à paralléliser** - que l'on souhaite ou non disposer d'un callback final.

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
l'application. Malgré cela certains exemples n'en font pas uage et préferrent déléguer à chaque vue la responsabilité
de passer la main à la suivante, de l'initialiser, etc.

Il me semble que cet usage est à déconseiller pour plusieurs raisons :

- On introduit un **couplage fort** entre les vues en termes fonctionnels mais aussi techniques (gestion du cycle de vie, etc.)
  L'évolutivité de l'application en est fortement réduite
- On introduit **beaucoup de boilerplate** dans chaque vue pour préparer la suivante, se 'nettoyer', etc. ce code
  technique se trouve alors éparpillé dans l'application et est **difficilement capitalisable**
- L'affichage de chaque vue est totalement dépendante de la précédente : **pas de `deep-linking`**. Autrement dit il est
  impossible d'accéder directement à une vue par son url et il n'existe q'une url : celle de l'application

Pour toutes ces raison (et surement des tas d'autres), les routeurs **[Backbone][backbone]** doivent être utilisés pour
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
être effectuée par une `main view` mais je ne pens pas que cela soit pertinent dans le routeur.

Certains exemples en ligne proposent des implémentation de routeurs **appelant des fonction "métier" de la vue** à
afficher :

    list: function() {
        var list = new Collection();
        list.fetch({success: function(){
            $("#content").html(new ListView({model: list}).el);
        }});
        this.headerView.selectMenuItem('list-menu');
    },

Même si dans cet exemple le routeur effectue peu d'opérations, ce n'est à mon sens pas à lui de demander à la vue de
mettre à jour son model, de gérer les success et errors de l'appel au serveur, etc. Je préferre un modèle ou **le routeur
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
(dont un en fenêtre modale) et un `KeyboardController` pour centraliser les évènements clavier sur le document. Deux
éléments qui auraient pu être traités par une vue principale ... sujet ouvert, donc ...

---
### Le problème des vues zombies

TODO

---
### Nested views

TODO

close
unbind events
unbind Pubsub subscribers
close nested views

---
### Vues Singleton

TODO

---
### Stratégie globale et cohérente de rendering

TODO

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
        'controllers/keyboard',
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

---
### Routeurs multiples

Cette question reste à adresser dans mon cas mais cela me parait indispensable dans le cas d'une application de taille
importante.

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
