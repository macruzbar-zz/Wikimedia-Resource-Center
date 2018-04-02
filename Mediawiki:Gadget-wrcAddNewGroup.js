/**
 * Gadget (based on JavaScript) to add new group (ANG) to 
 * [[Module:Wikimedia Resource Center/Groups]] on the Wikimedia 
 * Resource Center (WRC).
 */
( function () {
	'use strict';
	
	if ( mw.config.values.wgPageName.split('/')[0] == 'Connect' ) {
		
		mw.loader.using( [
			'ext.gadget.luaparse',
			'mediawiki.api',
			'oojs-ui',
			'oojs-ui-core',
			'oojs-ui.styles.icons-editing-core'
		] ).done( function () {
			var cleanRawEntry, gadgetMsg, getContentGroups,
				getContentModule, getRelevantRawEntry, openWindow,
				userLang;
	
			userLang = mw.config.get( 'wgUserLanguage' );
			/**
			 * Query the I18n Template for keywords to be used in this gadget.
			 * NOTE: The strings must be marked for translation before the keys/value 
			 * pair works in the gadget.
			 */
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
				 * Provides API parameters for getting the content of the 
				 * [[Module:Wikimedia Resource Center/Groups]] page
				 *
				 * @return {Object}
				 */
				getContentGroups = function () {
					return {
						action: 'query',
						prop: 'revisions',
						titles: 'Module:Wikimedia Resource Center/Groups',
						rvprop: 'content',
						rvlimit: 1
					};
				};
				
				/**
				 * Loops through the API response and returns a specific requested entry
				 *
				 * @param {Object} entries API response.
				 * @param {string} username The entry we want to pick out.
				 */
				getRelevantRawEntry = function ( entries, name ) {
					var i, j;
					// Look through the individual entries
					for ( i = 0; i < entries.length; i++ ) {
						// Loop through the individual key-value pairs within each entry
						for ( j = 0; j < entries[ i ].value.fields.length; j++ ) {
							if (
								entries[ i ].value.fields[ j ].key.name == 'name' &&
								entries[ i ].value.fields[ j ].value.value == name
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
						entryData[ relevantRawEntry[ i ].key.name ] = relevantRawEntry[ i ].value.value;
					}
					return entryData;
				};
				
				/**
				 * Get an entire content of the [[Module:Wikimedia Resource Center/Groups]] page
				 *
				 * @param {Object} sourceblob The original API return
				 * @return {Object} raw An Abstract Syntax Tree
				 */
				getContentModule = function ( sourceblob ) {
					var i, raw, ast;
					for ( i in sourceblob ) {  // should only be one result
						raw = sourceblob[ i ].revisions[ 0 ][ '*' ];
						ast = luaparse.parse( raw );
						return ast.body[ 0 ].arguments[ 0 ].fields;
					}
				};
	
				/**
				 * Subclass ProcessDialog
				 *
				 * @class WrcAddNewGroup
				 * @extends OO.ui.ProcessDialog
				 *
				 * @constructor
				 * @param {Object} config
				 */
				function WrcAddNewGroup( config ) {
					this.type = 'group'; // default here is group
					this.name = '';
					this.description = '';
					this.icon = '';
					this.facebook = '';
					this.twitter = '';
					this.facebook = '';
	
					if ( config.name ) {
						this.name = config.name;
					}
					if ( config.description ) {
						this.description = config.description;
					}
					if ( config.icon ) {
						this.icon = config.icon;
					}
					if ( config.facebook ) {
						this.facebook = config.facebook;
					}
					if ( config.twitter ) {
						this.twitter = config.twitter;
					}
					if ( config.youtube ) {
						this.youtube = config.youtube;
					}
					WrcAddNewGroup.super.call( this, config );
				}
				OO.inheritClass( WrcAddNewGroup, OO.ui.ProcessDialog );
	
				WrcAddNewGroup.static.name = 'wrcAddNewGroup';
				WrcAddNewGroup.static.title = gadgetMsg[ 'editor-ang-button' ];
				WrcAddNewGroup.static.actions = [
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
				WrcAddNewGroup.prototype.initialize = function () {
					var dialog;
					dialog = this;
	
					WrcAddNewGroup.super.prototype.initialize.call( this );
					this.content = new OO.ui.PanelLayout( {
						padded: true,
						expanded: false
					} );
					this.fieldType = new OO.ui.TextInputWidget( {
						value: this.type,
						indicator: 'required',
						required: true
					} );
					this.fieldName = new OO.ui.TextInputWidget( {
						value: this.name,
						indicator: 'required',
						required: true
					} );
					this.fieldDescription = new OO.ui.MultilineTextInputWidget( {
						value: this.description,
						rows: 5,
						indicator: 'required',
						required: true
					} );
					this.fieldIcon = new OO.ui.TextInputWidget( {
						value: this.icon
					} );
					// Adding form fields to get social media links 
					this.fieldFacebook = new OO.ui.TextInputWidget( {
						value: this.facebook
					} );
					this.fieldTwitter = new OO.ui.TextInputWidget( {
						value: this.twitter
					} );
					this.fieldYouTube = new OO.ui.TextInputWidget( {
						value: this.youtube
					} );
					
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
								this.fieldName,
								{
									label: gadgetMsg[ 'editor-ang-fieldname' ],
									align: 'top',
									help: gadgetMsg[ 'editor-ang-fieldname-help' ]
								}
							),
							new OO.ui.FieldLayout(
								this.fieldDescription,
								{
									label: gadgetMsg[ 'editor-ang-fielddescription' ],
									align: 'top',
									help: gadgetMsg[ 'editor-ang-fielddescription-help' ]
								}
							),
							new OO.ui.FieldLayout(
								this.fieldIcon,
								{
									label: gadgetMsg[ 'editor-ang-fieldicon' ],
									align: 'top',
									help: gadgetMsg[ 'editor-ang-fieldicon-help' ]
								}
							),
							new OO.ui.FieldLayout(
								this.fieldFacebook,
								{
									label: gadgetMsg[ 'editor-ang-fieldfacebook' ],
									align: 'top',
									help: gadgetMsg[ 'editor-ang-fieldfacebook-help' ]
								}
							),
							new OO.ui.FieldLayout(
								this.fieldTwitter,
								{
									label: gadgetMsg[ 'editor-ang-fieldtwitter' ],
									align: 'top',
									help: gadgetMsg[ 'editor-ang-fieldtwitter-help' ]
								}
							),
							new OO.ui.FieldLayout(
								this.fieldYouTube,
								{
									label: gadgetMsg[ 'editor-ang-fieldyoutube' ],
									align: 'top',
									help: gadgetMsg[ 'editor-ang-fieldyoutube-help' ]
								}
							)
						]
					} );
					
					if ( this.name ) {
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
				WrcAddNewGroup.prototype.getBodyHeight = function () {
					return 530; // NOTE: Remember to add height when new fields are added
				};
	
				/**
				 * In the event "Select" is pressed
				 */
				WrcAddNewGroup.prototype.getActionProcess = function ( action ) {
					var dialog = this;
					if ( action === 'continue' && dialog.fieldType.getValue() ) {
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
				 * Save the changes to [[Module:Wikimedia Resource Center/Groups]] page.
				 */
				WrcAddNewGroup.prototype.saveItem = function ( deleteFlag ) {
					var dialog = this, content, insertGroupPage,
					generateGrouppageData, gpName;
	
					dialog.pushPending();
	
					new mw.Api().get( getContentGroups() ).done( function ( data ) {
						var i, insertInPlace, sanitizeInput, processWorkingEntry,
							editSummary, manifest = [], workingEntry,
							generateKeyValuePair, entries;
							
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
							v = sanitizeInput( v );
							v = v.replace( /'/g, '\\\'' );
							res += '\'' + v + '\'';
							res += ',\n';
							
							return res;
						};
						
						/**
						 * Creates group data to resemble that in template.
						 */
						generateGrouppageData = function ( k, v ) {
							var res;
							res = '| '.concat( k, ' = ' );
							res += v + '\n';
							return res;
						};
						
						/**
						 * Compares a given Wikimedia Resource Center entry against the
						 * edit fields and applies changes where necessary. Also, build the 
						 * the group page Template here in order to create the group.
						 *
						 * @param {Object} workingEntry the entry being worked on
						 * @return {Object} The same entry but with modifications
						 */
						processWorkingEntry = function ( workingEntry ) {
							workingEntry.type = dialog.fieldType.getValue();
							
							// Building template for group connect
							insertGroupPage = '{{Connect group\n';
	
							if ( dialog.fieldType.getValue() ) {
								workingEntry.type = dialog.fieldType.getValue();
							} else if ( !dialog.fieldType.getValue() && workingEntry.type ) {
								delete workingEntry.type;
							}
							
							if ( dialog.fieldName.getValue() ) {
								workingEntry.name = dialog.fieldName.getValue();
							} else if ( !dialog.fieldName.getValue() && workingEntry.name ) {
								delete workingEntry.name;
							}
	
							if ( dialog.fieldDescription.getValue() ) {
								workingEntry.description = dialog.fieldDescription.getValue();
								insertGroupPage += generateGrouppageData(
									'introduction',
									workingEntry.description
								);
							} else if ( !dialog.fieldDescription.getValue() && workingEntry.description ) {
								delete workingEntry.description;
							}
	
							if ( dialog.fieldIcon.getValue() ) {
								workingEntry.icon = dialog.fieldIcon.getValue();
								insertGroupPage += generateGrouppageData(
									'icon',
									workingEntry.icon
								);
							} else if ( !dialog.fieldIcon.getValue() && workingEntry.icon ) {
								delete workingEntry.icon;
							}
							
							if ( dialog.fieldFacebook.getValue() ) {
								workingEntry.facebook = dialog.fieldFacebook.getValue();
								insertGroupPage += generateGrouppageData(
									'facebook',
									workingEntry.facebook
								);
							} else if ( !dialog.fieldFacebook.getValue() && workingEntry.facebook ) {
								delete workingEntry.facebook;
							}
							
							if ( dialog.fieldTwitter.getValue() ) {
								workingEntry.twitter = dialog.fieldTwitter.getValue();
								insertGroupPage += generateGrouppageData(
									'twitter',
									workingEntry.twitter
								);
							} else if ( !dialog.fieldTwitter.getValue() && workingEntry.twitter ) {
								delete workingEntry.twitter;
							}
							
							if ( dialog.fieldYouTube.getValue() ) {
								workingEntry.youtube = dialog.fieldYouTube.getValue();
								insertGroupPage += generateGrouppageData(
									'youtube',
									workingEntry.youtube
								);
							} else if ( !dialog.fieldYouTube.getValue() && workingEntry.youtube ) {
								delete workingEntry.youtube;
							}
							// Finish template for the group page to be created on Connect
							insertGroupPage += '}}\n[[Category:Connect groups|{{SUBPAGENAME}}]]';
	
							return workingEntry;
						};
						
						// Cycle through existing entries. If we are editing an existing
						// entry, that entry will be modified in place.
						entries = getContentModule( data.query.pages );
	
						for ( i = 0; i < entries.length; i++ ) {
							workingEntry = cleanRawEntry( entries[ i ].value.fields );
							if ( workingEntry.name == dialog.name ) {
								if ( deleteFlag ) {
									editSummary = 'Removing entry: '.concat( workingEntry.name );
								} else {
									workingEntry = processWorkingEntry( workingEntry );
									editSummary = 'Editing entry: '.concat( workingEntry.name );
								}
							}
							if ( workingEntry.name != dialog.name || !deleteFlag ) {
								manifest.push( workingEntry );
							}
						}
						
						// No unique group name means this is a new entry
						if ( !dialog.name ) {
							workingEntry = {};
							workingEntry = processWorkingEntry( workingEntry );
							editSummary = gadgetMsg[ 'editor-ang-preeditsummary' ].concat( workingEntry.name );
							manifest.push( workingEntry );
						}
						
						// Re-generate the Lua table based on `manifest`
						insertInPlace = 'return {\n';
						for ( i = 0; i < manifest.length; i++ ) {
							insertInPlace += '\t{\n';
							if ( manifest[ i ].type ) {
								insertInPlace += generateKeyValuePair(
									'type',
									manifest[ i ].type
								);
							}
							if ( manifest[ i ].name ) {
								insertInPlace += generateKeyValuePair(
									'name',
									manifest[ i ].name.replace( " ", "_" )
								);
								// Save the page name
								gpName = 'Connect/' + manifest[ i ].name;
							}
							if ( manifest[ i ].description ) {
								insertInPlace += generateKeyValuePair(
									'description',
									manifest[ i ].description
								);
							}
							if ( manifest[ i ].icon ) {
								insertInPlace += generateKeyValuePair(
									'icon',
									manifest[ i ].icon
								);
							}
							if ( manifest[ i ].facebook ) {
								insertInPlace += generateKeyValuePair(
									'facebook',
									manifest[ i ].facebook
								);
							}
							if ( manifest[ i ].twitter ) {
								insertInPlace += generateKeyValuePair(
									'twitter',
									manifest[ i ].twitter
								);
							}
							if ( manifest[ i ].youtube ) {
								insertInPlace += generateKeyValuePair(
									'youtube',
									manifest[ i ].youtube
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
								pageid: 10588351,  // Module:Wikimedia_Resource_Center/Groups
								text: insertInPlace,
								contentmodel: 'Scribunto'
							}
						).done( function () {
							dialog.close();
							// Purge the cache of the page from which the edit was made
							new mw.Api().postWithToken(
								'csrf',
								{ action: 'purge', titles: mw.config.values.wgPageName }
							).done( function () {
								location.reload();
							} );
						} ).fail( function () {
							alert( gadgetMsg[ 'editor-ang-failed-alert' ] );
							dialog.close();
						} );
						
						// Now create the group page as sub-page of connect
						new mw.Api().postWithToken(
							'csrf',
							{
								action: 'edit',
								title: gpName,  // Page name as sub-page of Connect
								summary: editSummary,
								text: insertGroupPage,
								contentmodel: 'wikitext'
							}
						).done( function () {
							dialog.close();
							// Purge the cache of the page from which the edit was made
							new mw.Api().postWithToken(
								'csrf',
								{ action: 'purge', titles: mw.config.values.wgPageName }
							).done( function () {
								location.reload();
							} );
						} ).fail( function () {
							alert( gadgetMsg[ 'editor-ang-failed-alert' ] );
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
					var wrcAddNewGroup, windowManager;
					config.size = 'large';
					wrcAddNewGroup = new WrcAddNewGroup( config );
	
					windowManager = new OO.ui.WindowManager();
					$( 'body' ).append( windowManager.$element );
					windowManager.addWindows( [ wrcAddNewGroup ] );
					windowManager.openWindow( wrcAddNewGroup );
				};
				
				// Edit user content via the form
				$( '.group-edit-icon' ).each( function () {
					var $icon = $( this ),
						editButton;
					editButton = new OO.ui.ButtonWidget( {
						framed: false,
						icon: 'edit'
					} ).on( 'click', function () {
						new mw.Api().get( getContentGroups() ).done( function ( data ) {
							var entryData, gpName, content;
							
							gpName = editButton.$element
								.closest( '.wrc-card' )
								.data( 'wrc-unique-id' );
								
							entryData = cleanRawEntry(
								getRelevantRawEntry(
									getContentModule( data.query.pages ),
									gpName
								)
							);
							openWindow( entryData );
						} );
					} );
					$icon.css( 'float', 'right' );
					$icon.append( editButton.$element );
				} );
				
				// Open dialog when "Add new group" is clicked
				$( '.wrc-ag-button' ).each( function () {
					var $addButton = $( this ),
						addButton;
					addButton = new OO.ui.ButtonWidget( {
						icon: 'add',
						label: gadgetMsg[ 'editor-ang-button' ],
						flags: [ 'primary', 'progressive' ]
					} ).on( 'click', function () {
						openWindow( {} );
					} );
					$addButton.css( 'margin', '1.125em' );
					$addButton.append( addButton.$element );
				} );
			} );
		} );
	}
}() );
