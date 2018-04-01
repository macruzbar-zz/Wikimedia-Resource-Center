/**
 * See:
 * https://meta.wikimedia.org/wiki/MediaWiki:Gadget-wrcEditor.js
 */
( function () {
	'use strict';

	mw.loader.using( [
		'mediawiki.api',
		'oojs-ui',
		'oojs-ui-core',
		'oojs-ui.styles.icons-editing-core',
		'ext.gadget.luaparse'
	] ).done( function () {
		var editButton, cleanRawEntry, gadgetMsg, getContentModuleQuery,
		getRelevantRawEntry, parseContentModule, openWindow, uniqueId, userLang;
		
		// Declare an asterisk to be used by mandatory editor fields
		var asterisk = " *";

		userLang = mw.config.get( 'wgUserLanguage' );
		new mw.Api().get( {
			action: 'query',
			list: 'messagecollection',
			mcgroup: 'page-Template:I18n/Wikimedia_Resource_Center',
			mclanguage: userLang
		} ).done( function ( data ) {
			var i, res, key, val, gadgetMsg = {};
			res = data.query.messagecollection;
			for ( i = 0; i < res.length; i++ ) {
				key = res[ i ].key.replace( 'Template:I18n/Wikimedia_Resource_Center/', '' );
				val = res[ i ].translation;
				if ( !val ) {
					// No translation; fall back to English
					val = res[ i ].definition;
				}
				gadgetMsg[ key ] = val;
			}

			 /**
			  * Provides API parameters for getting the content of the Wikimedia
			  * Resource Center.
			  *
			  * @return {Object}
			  */
			getContentModuleQuery = function () {
				return {
					action: 'query',
					prop: 'revisions',
					titles: 'Module:Wikimedia Resource Center/Content',
					rvprop: 'content',
					rvlimit: 1
				};
			};

			/**
			  * Takes Lua-formatted Wikimedia Resource Center content and returns an
			  * abstract syntax tree.
			  *
			  * @param {Object} sourceblob The original API return
			  * @return {Object} Abstract syntax tree
			  */
			parseContentModule = function ( sourceblob ) {
				var ast, i, raw;
				for ( i in sourceblob ) {  // should only be one result
					raw = sourceblob[ i ].revisions[ 0 ][ '*' ];
					ast = luaparse.parse( raw );
					return ast.body[ 0 ].arguments[ 0 ].fields;
				}
			};

			/**
			  * Picks through the abstract syntax tree and returns a specific requested
			  * entry
			  *
			  * @param {Object} entries The abstract syntax tree
			  * @param {string} uniqueId the entry we want to pick out.
			  */
			getRelevantRawEntry = function ( entries, uniqueId ) {
				var i, j;
				// Look through the individual entries
				for ( i = 0; i < entries.length; i++ ) {
					// Loop through the individual key-value pairs within each entry
					for ( j = 0; j < entries[ i ].value.fields.length; j++ ) {
						if (
							entries[ i ].value.fields[ j ].key.name == 'unique_id' &&
							entries[ i ].value.fields[ j ].value.value == uniqueId
						) {
							return entries[ i ].value.fields;
						}
					}
				}
			};

			/**
			  * Take a raw entry from the abstract syntax tree and make it an object
			  * that is easier to work with.
			  *
			  * @param {Object} relevantRawEntry the raw entry from the AST
			  * @return {Object} The cleaned up object
			  */
			cleanRawEntry = function ( relevantRawEntry ) {
				var entryData = {},
					i, j;
				for ( i = 0; i < relevantRawEntry.length; i++ ) {
					if ( relevantRawEntry[ i ].key.name == 'audiences' ) {
						entryData.audiences = [];
						for (
							j = 0;
							j < relevantRawEntry[ i ].value.fields.length;
							j++
						) {
							entryData.audiences.push(
								relevantRawEntry[ i ].value.fields[ j ].value.value
							);
						}
					} else {
						entryData[ relevantRawEntry[ i ].key.name ] = relevantRawEntry[ i ].value.value;
					}
				}
				return entryData;
			};

			/**
			  * Subclass ProcessDialog
			  *
			  * @class WrcEditor
			  * @extends OO.ui.ProcessDialog
			  *
			  * @constructor
			  * @param {Object} config
			  */
			function WrcEditor( config ) {
				this.header = config.header;
				this.description = '';
				this.contact = '';
				this.related = '';
				this.category = '';
				this.audiences = [];

				if ( config.unique_id ) {
					this.uniqueId = config.unique_id;
				}
				// If this is a new entry, there is no unique ID until the page is
				// saved. This is how we know it's a new entry.

				if ( config.description ) {
					this.description = config.description;
				}
				if ( config.contact ) {
					this.contact = config.contact;
				}
				if ( config.related ) {
					this.related = config.related;
				}
				if ( config.category ) {
					this.category = config.category;
				}
				if ( config.audiences ) {
					this.audiences = config.audiences;
				}
				if ( config.community ) {
					this.community = config.community;
				}
				WrcEditor.super.call( this, config );
			}
			OO.inheritClass( WrcEditor, OO.ui.ProcessDialog );

			WrcEditor.static.name = 'wrcEditor';
			WrcEditor.static.title = gadgetMsg[ 'editor-header' ];
			WrcEditor.static.actions = [
				{
					action: 'continue',
					modes: 'edit',
					label: gadgetMsg[ 'editor-save' ],
					flags: [ 'primary', 'constructive' ]
				},
				{
					action: 'cancel',
					modes: 'edit',
					label: gadgetMsg[ 'editor-cancel' ],
					flags: 'safe'
				}
			];

			/**
			  * Use the initialize() method to add content to the dialog's $body,
			  * to initialize widgets, and to set up event handlers.
			  */
			WrcEditor.prototype.initialize = function () {
				var dialog, fieldAudiencesSelected, fieldCommunityEvaluate, i;

				dialog = this;

				WrcEditor.super.prototype.initialize.call( this );
				this.content = new OO.ui.PanelLayout( {
					padded: true,
					expanded: false
				} );
				this.fieldHeader = new OO.ui.TextInputWidget( {
					value: this.header
				} );
				this.fieldDescription = new OO.ui.MultilineTextInputWidget( {
					value: this.description,
					rows: 5
				} );
				this.fieldRelated = new OO.ui.TextInputWidget( {
					value: this.related
				} );
				this.fieldContact = new OO.ui.TextInputWidget( {
					value: this.contact
				} );
				this.fieldCategory = new OO.ui.DropdownInputWidget( {
					options: [
						new OO.ui.MenuOptionWidget( {
							data: 'Contact and Questions',
							label: gadgetMsg[ 'category-contact-and-questions' ]
						} ),
						new OO.ui.MenuOptionWidget( {
							data: 'Skills Development',
							label: gadgetMsg[ 'category-skills-development' ]
						} ),
						new OO.ui.MenuOptionWidget( {
							data: 'Grants Support',
							label: gadgetMsg[ 'category-grants-support' ]
						} ),
						new OO.ui.MenuOptionWidget( {
							data: 'Programs Support',
							label: gadgetMsg[ 'category-programs-support' ]
						} ),
						new OO.ui.MenuOptionWidget( {
							data: 'Software Basics',
							label: gadgetMsg[ 'category-software-basics' ]
						} ),
						new OO.ui.MenuOptionWidget( {
							data: 'Software Development',
							label: gadgetMsg[ 'category-software-development' ]
						} ),
						new OO.ui.MenuOptionWidget( {
							data: 'Technical Infrastructure',
							label: gadgetMsg[ 'category-technical-infrastructure' ]
						} ),
						new OO.ui.MenuOptionWidget( {
							data: 'Global Reach Partnerships',
							label: gadgetMsg[ 'category-global-reach-partnerships' ]
						} ),
						new OO.ui.MenuOptionWidget( {
							data: 'Legal',
							label: gadgetMsg[ 'category-legal' ]
						} ),
						new OO.ui.MenuOptionWidget( {
							data: 'Communications',
							label: gadgetMsg[ 'category-communications' ]
						} )
					]
				} );

				this.fieldCategory.setValue( this.category );

				fieldAudiencesSelected = [];
				for ( i = 0; i < this.audiences.length; i++ ) {
					fieldAudiencesSelected.push(
						{ data: this.audiences[ i ], label: gadgetMsg[ 'audience-' + this.audiences[ i ].toLowerCase().replace( / /g, '-' ) ] }
					);
				}
				this.fieldAudiences = new OO.ui.MenuTagMultiselectWidget( {
					selected: fieldAudiencesSelected,
					options: [
						{ data: 'For program coordinators', label: gadgetMsg[ 'audience-for-program-coordinators' ] },
						{ data: 'For contributors', label: gadgetMsg[ 'audience-for-contributors' ] },
						{ data: 'For developers', label: gadgetMsg[ 'audience-for-developers' ] },
						{ data: 'For affiliate organizers', label: gadgetMsg[ 'audience-for-affiliate-organizers' ] }
					]
				} );

				fieldCommunityEvaluate = function () {
					if ( dialog.community == 'no' ) {
						return true;
					}
					return false;
				};

				this.fieldCommunity = new OO.ui.CheckboxInputWidget( {
					selected: fieldCommunityEvaluate()
				} );
				
				// This will be used to make a notice for required fields
				//this.fieldNotice = new OO.ui.HiddenInputWidget( {} );
				
				this.deleteButton = new OO.ui.ButtonWidget( {
					label: gadgetMsg[ 'editor-remove-entry' ],
					icon: 'trash',
					flags: [ 'destructive' ]
				} ).on( 'click', function () {
					new OO.ui.confirm(
						gadgetMsg[ 'editor-remove-confirm' ]
					).done( function ( confirmed ) {
						if ( confirmed ) {
							dialog.saveItem( 'delete' );
						}
					} );
				} );

				// Append things to fieldSet
				this.fieldSet = new OO.ui.FieldsetLayout( {
					items: [
						new OO.ui.FieldLayout(
							this.fieldHeader,
							{
								label: gadgetMsg[ 'editor-field-header' ],
								align: 'top',
								help: gadgetMsg[ 'editor-help-header' ]
							}
						),
						new OO.ui.FieldLayout(
							this.fieldDescription,
							{
								label: gadgetMsg[ 'editor-field-description' ],
								align: 'top',
								help: gadgetMsg[ 'editor-help-description' ]
							}
						),
						new OO.ui.FieldLayout(
							this.fieldContact,
							{
								label: gadgetMsg[ 'editor-field-contact' ],
								align: 'top',
								help: gadgetMsg[ 'editor-help-contact' ]
							}
						),
						new OO.ui.FieldLayout(
							this.fieldRelated,
							{
								label: gadgetMsg[ 'editor-field-relatedpages' ],
								align: 'top',
								help: gadgetMsg[ 'editor-help-relatedpages' ]
							}
						),
						new OO.ui.FieldLayout(
							this.fieldCategory,
							{
								label: gadgetMsg[ 'editor-field-category' ] + asterisk,
								align: 'top'
							}
						),
						new OO.ui.FieldLayout(
							this.fieldAudiences,
							{
								label: gadgetMsg[ 'editor-field-audiences' ] + asterisk,
								align: 'top'
							}
						),
						new OO.ui.FieldLayout(
							this.fieldCommunity,
							{
								label: gadgetMsg[ 'editor-field-wmf' ],
								align: 'inline'
							}
						)/*,
						new OO.ui.FieldLayout(
							this.fieldNotice,
							{
								label: gadgetMsg[ 'required-field-notice' ],
								align: 'top'
							}
						)*/
					]
				} );

				if ( this.uniqueId ) {
					this.fieldSet.addItems( [
						new OO.ui.FieldLayout(
							this.deleteButton
						)
					] );
				}

				// When everything is done
				this.content.$element.append( this.fieldSet.$element );
				this.$body.append( this.content.$element );
			};

			/**
			  * Set custom height for the modal window
			  *
			  */
			WrcEditor.prototype.getBodyHeight = function () {
				return 660;
			};

			/**
			  * In the event "Select" is pressed
			  *
			  */
			WrcEditor.prototype.getActionProcess = function ( action ) {
				var dialog = this;
				if ( action === 'continue' && dialog.fieldHeader.getValue() ) {
					return new OO.ui.Process( function () {
						dialog.saveItem();
					} );
				} else {
					return new OO.ui.Process( function () {
						dialog.close();
					} );
				}
				return NewItemDialog.parent.prototype.getActionProcess.call( this, action );
			};

			/**
			  * Save the changes to the Lua table.
			  *
			  * @param {string} deleteFlag A string that says 'delete' (or anything,
			  *   really) if the entry being edited is flagged for deletion
			  */
			WrcEditor.prototype.saveItem = function ( deleteFlag ) {
				var dialog = this;

				dialog.pushPending();

				new mw.Api().get( getContentModuleQuery() ).done( function ( data ) {
					var i, j, editSummary, entries, insertInPlace, insertInPlacei18n,
						itemIndex, generateKeyValuePair, generateTranslateStuff,
						manifest = [],
 									processWorkingEntry, raw, sanitizeInput,
						workingEntry;

					/**
					  * Sanitizes input for saving to wiki
					  *
					  * @param {string} s
					  *
					  * @return {string}
					  */
					sanitizeInput = function ( s ) {
						return s
							.replace( /\\/g, '\\\\' )
						.replace( /\n/g, '<br />' );
					};

					/**
					  * Creates Lua-style key-value pairs, including converting the
					  * audiences array into a proper sequential table.
					  *
					  * @param {string} k The key
					  * @param {string} v The value
					  *
					  * @return {string}
					  */
					generateKeyValuePair = function ( k, v ) {
						var res, jsonarray;
						res = '\t\t'.concat( k, ' = ' );
						if ( k == 'audiences' ) {
							jsonarray = JSON.stringify( v );
							// Lua uses { } for "arrays"
							jsonarray = jsonarray.replace( '[', '{' );
							jsonarray = jsonarray.replace( ']', '}' );
							// Style changes (single quotes, spaces after commas)
							jsonarray = jsonarray.replace( /\"/g, '\'' );
							jsonarray = jsonarray.replace( /,/g, ', ' );
							// Basic input sanitation
							jsonarray = sanitizeInput( jsonarray );
							res += jsonarray;
						} else {
							v = sanitizeInput( v );
							v = v.replace( /'/g, '\\\'' );
							res += '\'' + v + '\'';
						}
						res += ',\n';
						return res;
					};

					generateTranslateStuff = function ( k, v, uid ) {
						return '* <trans' + 'late><!--T:content-' +
							uid +
							'-' +
							k +
							'--> ' +
							v +
							'</trans' + 'late>\n';
					};

					/**
					  * Compares a given Wikimedia Resource Center entry against the
					  * edit fields and applies changes where relevant.
					  *
					  * @param {Object} workingEntry the entry being worked on
					  * @return {Object} The same entry but with modifications
					  */
					processWorkingEntry = function ( workingEntry ) {
						workingEntry.header = dialog.fieldHeader.getValue();

						if ( dialog.fieldDescription.getValue() ) {
							workingEntry.description = dialog.fieldDescription.getValue();
						} else if ( !dialog.fieldDescription.getValue() && workingEntry.description ) {
							delete workingEntry.description;
						}

						if ( dialog.fieldContact.getValue() ) {
							workingEntry.contact = dialog.fieldContact.getValue();
						} else if ( !dialog.fieldContact.getValue() && workingEntry.contact ) {
							delete workingEntry.contact;
						}

						if ( dialog.fieldRelated.getValue() ) {
							workingEntry.related = dialog.fieldRelated.getValue();
						} else if ( !dialog.fieldRelated.getValue() && workingEntry.related ) {
							delete workingEntry.related;
						}

						if ( dialog.fieldCategory.getValue() ) {
							workingEntry.category = dialog.fieldCategory.getValue();
						} else if ( !dialog.fieldCategory.getValue() && workingEntry.category ) {
							delete workingEntry.category;
						}

						if ( dialog.fieldAudiences.getValue() ) {
							workingEntry.audiences = dialog.fieldAudiences.getValue();
						} else if ( !dialog.fieldAudiences.getValue() && workingEntry.audiences ) {
							delete workingEntry.audiences;
						}

						if ( dialog.fieldCommunity.isSelected() ) {
							workingEntry.community = 'no';
						} else if ( !dialog.fieldCommunity.isSelected() && workingEntry.community ) {
							delete workingEntry.community;
						}

						return workingEntry;
					};

					// Cycle through existing entries. If we are editing an existing
					// entry, that entry will be modified in place.
					entries = parseContentModule( data.query.pages );

					for ( i = 0; i < entries.length; i++ ) {
						workingEntry = cleanRawEntry( entries[ i ].value.fields );
						if ( workingEntry.unique_id == dialog.uniqueId ) {
							if ( deleteFlag ) {
								editSummary = 'Removing entry '.concat( workingEntry.header );
							} else {
								workingEntry = processWorkingEntry( workingEntry );
								editSummary = 'Editing entry '.concat( workingEntry.header );
							}
						}
						if ( workingEntry.unique_id != dialog.uniqueId || !deleteFlag ) {
							manifest.push( workingEntry );
						}
					}

					// No unique ID means this is a new entry
					if ( !dialog.uniqueId ) {
						workingEntry = {
							unique_id: Math.random().toString( 36 ).substring( 2 )
						};
						workingEntry = processWorkingEntry( workingEntry );
						editSummary = 'Adding entry '.concat( workingEntry.header );
						manifest.push( workingEntry );
					}

					// Re-generate the Lua table based on `manifest`
					// Also re-generate the translation string page
					insertInPlace = 'return {\n';
					insertInPlacei18n = '==Content==\n';
					for ( i = 0; i < manifest.length; i++ ) {
						insertInPlace += '\t{\n';
						if ( manifest[ i ].unique_id ) {
							insertInPlace += generateKeyValuePair(
								'unique_id',
								manifest[ i ].unique_id
							);
						}
						if ( manifest[ i ].header ) {
							insertInPlace += generateKeyValuePair(
								'header',
								manifest[ i ].header
							);
							insertInPlacei18n += generateTranslateStuff(
								'header',
								manifest[ i ].header,
								manifest[ i ].unique_id
							);
						}
						if ( manifest[ i ].description ) {
							insertInPlace += generateKeyValuePair(
								'description',
								manifest[ i ].description
							);
							insertInPlacei18n += generateTranslateStuff(
								'description',
								manifest[ i ].description,
								manifest[ i ].unique_id
							);
						}
						if ( manifest[ i ].contact ) {
							insertInPlace += generateKeyValuePair(
								'contact',
								manifest[ i ].contact
							);
							insertInPlacei18n += generateTranslateStuff(
								'contact',
								manifest[ i ].contact,
								manifest[ i ].unique_id
							);
						}
						if ( manifest[ i ].related ) {
							insertInPlace += generateKeyValuePair(
								'related',
								manifest[ i ].related
							);
							insertInPlacei18n += generateTranslateStuff(
								'related',
								manifest[ i ].related,
								manifest[ i ].unique_id
							);
						}
						if ( manifest[ i ].category ) {
							insertInPlace += generateKeyValuePair(
								'category',
								manifest[ i ].category
							);
						}
						if ( manifest[ i ].audiences ) {
							insertInPlace += generateKeyValuePair(
								'audiences',
								manifest[ i ].audiences
							);
						}
						if ( manifest[ i ].community ) {
							insertInPlace += generateKeyValuePair(
								'community',
								manifest[ i ].community
							);
						}
						insertInPlace += '\t},\n';
					}
					insertInPlace += '}';

					new mw.Api().postWithToken(
						'csrf',
						{
							action: 'edit',
							nocreate: true,
							summary: editSummary,
							pageid: 10355457,  // Module:Wikimedia_Resource_Center/Content
							text: insertInPlace,
							contentmodel: 'Scribunto'
						}
					).done( function () {
						dialog.close();
						new mw.Api().postWithToken(
							'csrf',
							{
								action: 'edit',
								nocreate: true,
								summary: editSummary,
								pageid: 10405434,  // Template:I18n/Wikimedia_Resource_Center
								section: 4, // ==Content==
								text: insertInPlacei18n
							}
						).done( function () {
							// Purge the cache of the page from which the edit was made
							new mw.Api().postWithToken(
								'csrf',
								{ action: 'purge', titles: mw.config.values.wgPageName }
							).done( function () {
								location.reload();
							} );
						} );
					} ).fail( function () {
						alert( gadgetMsg[ 'editor-editfailed' ] );
						dialog.close();
					} );
				} );
			};

			/**
				* Event handler for when someone clicks on an edit icon/button
				*
				* @param {Object} config
				*/
			openWindow = function ( config ) {
				var wrcEditor, windowManager;
				config.size = 'large';
				wrcEditor = new WrcEditor( config );

				windowManager = new OO.ui.WindowManager();
				$( 'body' ).append( windowManager.$element );
				windowManager.addWindows( [ wrcEditor ] );
				windowManager.openWindow( wrcEditor );
			};

			$( '.wrc-icons' ).each( function () {
				var $icon = $( this ),
					editButton;
				editButton = new OO.ui.ButtonWidget( {
					framed: false,
					icon: 'edit'
				} ).on( 'click', function () {
					new mw.Api().get( getContentModuleQuery() ).done( function ( data ) {
						var entryData, uniqueId;

						uniqueId = editButton.$element
							.closest( '.wrc-card' )
							.data( 'wrc-unique-id' );

						entryData = cleanRawEntry(
							getRelevantRawEntry(
								parseContentModule( data.query.pages ),
								uniqueId
							)
						);
						openWindow( entryData );
					} );
				} );
				$icon.append( editButton.$element );
			} );

			$( '.wrc-add-button' ).each( function () {
				var $addButton = $( this ),
					addButton;
				addButton = new OO.ui.ButtonWidget( {
					icon: 'add',
					label: gadgetMsg[ 'editor-addbutton' ],
					flags: [ 'primary', 'progressive' ]
				} ).on( 'click', function () {
					var category = addButton.$element
						.closest( '.wrc-add-button' )
						.data( 'wrc-category' );
					openWindow( { category: category } );
				} );
				$addButton.css( 'margin', '1.125em' );
				$addButton.append( addButton.$element );
			} );
		} );
	} );
}() );
