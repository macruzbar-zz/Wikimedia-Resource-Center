/**
 * Gadget to add new group (ANG) to [[m:Connect/Groups]] on the Wikimedia Resource Center (WRC).
 */
( function () {
	'use strict';
	
	if ( mw.config.values.wgPageName.split('/')[0] == 'Connect' ) {
		
		mw.loader.using( [
			'mediawiki.api',
			'oojs-ui',
			'oojs-ui-core',
			'oojs-ui.styles.icons-editing-core'
		] ).done( function () {
			var gadgetMsg, getContentGroups, openWindow,
				userLang, getContentModule, getRelevantRawEntry;
	
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
				 * Provides API parameters for getting the content of the [[m:Connect/Groups]] page
				 *
				 * @return {Object}
				 */
				getContentGroups = function () {
					return {
						action: 'query',
						prop: 'revisions',
						titles: 'Connect/Groups',
						rvprop: 'content',
						rvlimit: 1
					};
				};
				
				/**
				 * Picks through the API response and returns a specific requested entry
				 *
				 * @param {Object} entries API response.
				 * @param {string} username the entry we want to pick out.
				 */
				getRelevantRawEntry = function ( entries, group ) {
					// Implement algorithm to get the required entry 
					// from the list of entries.
				};
				
				/**
				 * Gets the entire content of the [[m:Connect/Groups]] page
				 *
				 * @param {Object} sourceblob The original API return
				 * @return {Object} raw Entire page content
				 */
				getContentModule = function ( sourceblob ) {
					var i, raw;
					for ( i in sourceblob ) {
						raw = sourceblob[ i ].revisions[ 0 ][ '*' ];
						return raw;
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
					// of the group on [[m:Connect]]
					this.fieldFacebook = new OO.ui.TextInputWidget( {
						value: this.facebook
					} );
					this.fieldTwitter = new OO.ui.TextInputWidget( {
						value: this.twitter
					} );
					this.fieldYouTube = new OO.ui.TextInputWidget( {
						value: this.youtube
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
					
					// When everything is done
					this.content.$element.append( this.fieldSet.$element );
					this.$body.append( this.content.$element );
				};
	
				/**
				 * Set custom height for the modal window
				 *
				 */
				WrcAddNewGroup.prototype.getBodyHeight = function () {
					return 500; // NOTE: Remember to add height when new fields are added
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
				 * Save the changes to the [[m:Connect/Groups]] page.
				 */
				WrcAddNewGroup.prototype.saveItem = function () {
					var dialog = this, content, insertGroupPage;
	
					dialog.pushPending();
	
					new mw.Api().get( getContentGroups() ).done( function ( data ) {
						var i, insertInPlace, generateGroupData, processWorkingEntry,
							editSummary, manifest = [], workingEntry, gpName;
	
						/**
						 * Creates individual data to resemble that in template.
						 */
						generateGroupData = function ( k, v ) {
							var res;
							res = '| '.concat( k, ' = ' );
							res += v + '\n';
							return res;
						};
						
						/**
						 * Compares a given Wikimedia Resource Center entry against the
						 * edit fields and applies changes where relevant.
						 *
						 * @param {Object} workingEntry the entry being worked on
						 * @return {Object} The same entry but with modifications
						 */
						processWorkingEntry = function ( workingEntry ) {
							workingEntry.type = dialog.fieldType.getValue();
	
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
							} else if ( !dialog.fieldDescription.getValue() && workingEntry.description ) {
								delete workingEntry.description;
							}
	
							if ( dialog.fieldIcon.getValue() ) {
								workingEntry.icon = dialog.fieldIcon.getValue();
							} else if ( !dialog.fieldIcon.getValue() && workingEntry.icon ) {
								delete workingEntry.icon;
							}
							
							if ( dialog.fieldFacebook.getValue() ) {
								workingEntry.facebook = dialog.fieldFacebook.getValue();
							} else if ( !dialog.fieldFacebook.getValue() && workingEntry.facebook ) {
								delete workingEntry.facebook;
							}
							
							if ( dialog.fieldTwitter.getValue() ) {
								workingEntry.twitter = dialog.fieldTwitter.getValue();
							} else if ( !dialog.fieldTwitter.getValue() && workingEntry.twitter ) {
								delete workingEntry.twitter;
							}
							
							if ( dialog.fieldYouTube.getValue() ) {
								workingEntry.youtube = dialog.fieldYouTube.getValue();
							} else if ( !dialog.fieldYouTube.getValue() && workingEntry.youtube ) {
								delete workingEntry.youtube;
							}
	
							return workingEntry;
						};
						
						workingEntry = {};
						workingEntry = processWorkingEntry( workingEntry );
						editSummary = 'Adding new group '.concat( workingEntry.name );
						manifest.push( workingEntry );

						// Re-generate the [[Connect/Groups]] table based on `manifest`
						insertInPlace = '\n{{Connect listing\n';
						insertGroupPage = '\n{{Connect group\n';
						for ( i = 0; i < manifest.length; i++ ) {
							if ( manifest[ i ].type ) {
								insertInPlace += generateGroupData(
									'type',
									manifest[ i ].type
								);
							}
							if ( manifest[ i ].name ) {
								insertInPlace += generateGroupData(
									'name',
									manifest[ i ].name
								);
								
								// Save the page name
								gpName = 'Connect/' + manifest[ i ].name;
							}
							if ( manifest[ i ].description ) {
								insertInPlace += generateGroupData(
									'description',
									manifest[ i ].description
								);
								insertGroupPage += generateGroupData(
									'introduction',
									manifest[ i ].description
								);
							}
							if ( manifest[ i ].icon ) {
								insertInPlace += generateGroupData(
									'icon',
									manifest[ i ].icon
								);
								insertGroupPage += generateGroupData(
									'icon',
									manifest[ i ].icon
								);
							}
							if ( manifest[ i ].facebook ) {
								insertGroupPage += generateGroupData(
									'facebook',
									manifest[ i ].facebook
								);
							}
							if ( manifest[ i ].twitter ) {
								insertGroupPage += generateGroupData(
									'twitter',
									manifest[ i ].twitter
								);
							}
							if ( manifest[ i ].youtube ) {
								insertGroupPage += generateGroupData(
									'youtube',
									manifest[ i ].youtube
								);
							}
						}
						insertInPlace += '}}\n';
						// Finish building template for group connect
						insertGroupPage += '}}\n[[Category:Connect groups|{{SUBPAGENAME}}]]\n';
						
						// Get content of the [[m:Connect/Groups]] page
						content = getContentModule( data.query.pages );
						// Append new individual to entire page content
						insertInPlace = content + insertInPlace;
						
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
							alert( 'Group page not created!' );
							dialog.close();
						} );
	
						// edit the [[m:Connect/Groups]] page and add new group
						// stackable card via the api
						new mw.Api().postWithToken(
							'csrf',
							{
								action: 'edit',
								nocreate: true,
								summary: editSummary,
								pageid: 10454753,  // Connect/Groups
								text: insertInPlace,
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
							var entryData, groupname, content;
							
							groupname = editButton.$element
							.closest( '.wrc-card' )
							.data( 'wrc-unique-id' );
							
							content = getContentModule( data.query.pages );
							//entryData = getRelevantRawEntry( content, groupname );
							
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