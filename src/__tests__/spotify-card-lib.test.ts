import { SpotifyCard } from '../spotify-card';
import { SpotcastConnector } from '../spotcast-connector';
import { SpotifyCardLib, DisplayStyle } from '../spotify-card-lib';
import { SpotifyCardConfig, CurrentPlayer, ConnectDevice, ChromecastDevice } from '../types';
import {
  HassEntity,
  Connection,
  Collection,
  HassServices,
  HassDomainServices,
  HassEntities,
} from 'home-assistant-js-websocket';
import { HomeAssistant } from 'custom-card-helpers';

jest.mock('../spotify-card');
jest.mock('../spotcast-connector');
jest.mock('../editor');

let spotify_card!: SpotifyCard;
let spotify_card_lib!: SpotifyCardLib;

describe('SpotifyCardLib', () => {
  beforeEach(() => {
    spotify_card = new SpotifyCard();
    spotify_card_lib = new SpotifyCardLib(spotify_card);
  });

  describe('setConfig', () => {
    test('playlist_type_error', () => {
      const config = jest.genMockFromModule<SpotifyCardConfig>('../types');
      config.playlist_type = 'not_existing';
      expect(spotify_card_lib.setConfig(config)).toBe('playlist_type');
    });
    test('display_style_error', () => {
      const config = jest.genMockFromModule<SpotifyCardConfig>('../types');
      config.display_style = 'not_existing';
      expect(spotify_card_lib.setConfig(config)).toBe('display_style');
    });
    test('no_error', () => {
      const config = jest.genMockFromModule<SpotifyCardConfig>('../types');
      expect(spotify_card_lib.setConfig(config)).toBe('');
    });
  });

  describe('getDisplayStyle', () => {
    beforeEach(() => {
      spotify_card_lib.config = jest.genMockFromModule<SpotifyCardConfig>('../types');
    });
    test('grid', () => {
      spotify_card_lib.config.display_style = 'grid';
      expect(spotify_card_lib.getDisplayStyle()).toEqual(DisplayStyle.Grid);
    });
    test('list', () => {
      spotify_card_lib.config.display_style = 'list';
      expect(spotify_card_lib.getDisplayStyle()).toEqual(DisplayStyle.List);
    });
    test('other', () => {
      spotify_card_lib.config.display_style = 'other';
      expect(spotify_card_lib.getDisplayStyle()).toEqual(DisplayStyle.List);
    });
    test('undefined', () => {
      expect(spotify_card_lib.getDisplayStyle()).toEqual(DisplayStyle.List);
    });
  });

  describe('getPlayingState', () => {
    test('playing', () => {
      spotify_card_lib.spotify_state = jest.genMockFromModule<HassEntity>('home-assistant-js-websocket');
      spotify_card_lib.spotify_state.state = 'playing';
      expect(spotify_card_lib.getPlayingState()).toBeTruthy();
    });
    test('not_playing', () => {
      spotify_card_lib.spotify_state = jest.genMockFromModule<HassEntity>('home-assistant-js-websocket');
      spotify_card_lib.spotify_state.state = 'not_playing';
      expect(spotify_card_lib.getPlayingState()).toBeFalsy();
    });
    test('undefined', () => {
      expect(spotify_card_lib.getPlayingState()).toBeFalsy();
    });
  });

  describe('getShuffleState', () => {
    beforeEach(() => {
      spotify_card_lib._spotcast_connector = jest.genMockFromModule<SpotcastConnector>('../spotcast-connector');
    });
    test('undefined', () => {
      expect(spotify_card_lib.getShuffleState()).toBeFalsy();
    });
    test('true', () => {
      spotify_card_lib._spotcast_connector.player = jest.genMockFromModule<CurrentPlayer>('../types');
      spotify_card_lib._spotcast_connector.player.shuffle_state = true;
      expect(spotify_card_lib.getShuffleState()).toBeTruthy();
    });
    test('false', () => {
      spotify_card_lib._spotcast_connector.player = jest.genMockFromModule<CurrentPlayer>('../types');
      spotify_card_lib._spotcast_connector.player.shuffle_state = false;
      expect(spotify_card_lib.getShuffleState()).toBeFalsy();
    });
  });

  describe('getSpotifyEntityState', () => {
    test('undefined', () => {
      expect(spotify_card_lib.getSpotifyEntityState()).toBe('');
    });
    test('playing', () => {
      spotify_card_lib.spotify_state = jest.genMockFromModule<HassEntity>('home-assistant-js-websocket');
      spotify_card_lib.spotify_state.state = 'playing';
      expect(spotify_card_lib.getSpotifyEntityState()).toBe('playing');
    });
    test('not_playing', () => {
      spotify_card_lib.spotify_state = jest.genMockFromModule<HassEntity>('home-assistant-js-websocket');
      spotify_card_lib.spotify_state.state = 'not_playing';
      expect(spotify_card_lib.getSpotifyEntityState()).toBe('not_playing');
    });
  });

  describe('isSpotcastInstalled', () => {
    test('no_hass', () => {
      expect(spotify_card_lib.isSpotcastInstalled()).toBeFalsy();
    });
    test('no_spotcast', () => {
      spotify_card_lib.hass = jest.genMockFromModule<HomeAssistant>('home-assistant-js-websocket');
      spotify_card_lib.hass.connection = jest.genMockFromModule<Connection>('home-assistant-js-websocket');
      const hassConnection = jest.fn(() => {
        const hassconn = jest.genMockFromModule<Collection<HassServices>>('home-assistant-js-websocket');
        hassconn.state = jest.genMockFromModule<HassServices>('home-assistant-js-websocket');
        return hassconn;
      });
      spotify_card_lib.getHassConnection = hassConnection;
      expect(spotify_card_lib.isSpotcastInstalled()).toBeFalsy();
    });
    test('installed_spotcast', () => {
      spotify_card_lib.hass = jest.genMockFromModule<HomeAssistant>('home-assistant-js-websocket');
      spotify_card_lib.hass.connection = jest.genMockFromModule<Connection>('home-assistant-js-websocket');
      const hassConnection = jest.fn(() => {
        const hassconn = jest.genMockFromModule<Collection<HassServices>>('home-assistant-js-websocket');
        hassconn.state = jest.genMockFromModule<HassServices>('home-assistant-js-websocket');
        hassconn.state.spotcast = jest.genMockFromModule<HassDomainServices>('home-assistant-js-websocket');
        return hassconn;
      });
      spotify_card_lib.getHassConnection = hassConnection;
      expect(spotify_card_lib.isSpotcastInstalled()).toBeTruthy();
    });
  });

  describe('requestUpdate', () => {
    beforeEach(() => {
      spotify_card_lib._spotcast_connector = jest.genMockFromModule<SpotcastConnector>('../spotcast-connector');
      spotify_card_lib._spotcast_connector.fetchPlaylists = jest.fn().mockResolvedValue(true);
    });
    test('no_spotcast', () => {
      spotify_card_lib.isSpotcastInstalled = jest.fn().mockReturnValueOnce(false);
      spotify_card_lib.requestUpdate();
      expect(spotify_card_lib._spotcast_connector.fetchPlaylists).not.toHaveBeenCalled();
    });
    test('is_loading', () => {
      spotify_card_lib.isSpotcastInstalled = jest.fn().mockReturnValueOnce(true);
      spotify_card_lib._spotcast_connector.is_loading = jest.fn().mockReturnValueOnce(true);
      spotify_card_lib.requestUpdate();
      expect(spotify_card_lib._spotcast_connector.fetchPlaylists).not.toHaveBeenCalled();
    });
    test('was called', () => {
      spotify_card_lib.isSpotcastInstalled = jest.fn().mockReturnValueOnce(true);
      spotify_card_lib._spotcast_connector.is_loading = jest.fn().mockReturnValueOnce(false);
      spotify_card_lib.requestUpdate();
      expect(spotify_card_lib._spotcast_connector.fetchPlaylists).toHaveBeenCalled();
    });
  });

  describe('getCurrentPlayer', () => {
    test('getCurrentPlayer', () => {
      spotify_card_lib._spotcast_connector = jest.genMockFromModule<SpotcastConnector>('../spotcast-connector');
      spotify_card_lib._spotcast_connector.getCurrentPlayer = jest.fn();
      spotify_card_lib.getCurrentPlayer();
      expect(spotify_card_lib._spotcast_connector.getCurrentPlayer).toHaveBeenCalled();
    });
  });

  describe('dataAvailable', () => {
    test('dataAvailable', () => {
      spotify_card_lib._spotcast_connector = jest.genMockFromModule<SpotcastConnector>('../spotcast-connector');
      spotify_card_lib._spotcast_connector.is_loaded = jest.fn();
      spotify_card_lib.dataAvailable();
      expect(spotify_card_lib._spotcast_connector.is_loaded).toHaveBeenCalled();
    });
  });

  describe('updated', () => {
    test('hass_set', () => {
      const hass = jest.genMockFromModule<HomeAssistant>('home-assistant-js-websocket');
      spotify_card_lib.updated(hass);
      expect(spotify_card_lib.hass).toBe(hass);
    });
    test('doSubscribeEntities', () => {
      const hass = jest.genMockFromModule<HomeAssistant>('home-assistant-js-websocket');
      spotify_card_lib.doSubscribeEntities = jest.fn();
      spotify_card_lib.updated(hass);
      expect(spotify_card_lib.doSubscribeEntities).toHaveBeenCalled();
    });
  });

  describe('connectedCallback', () => {
    test('doSubscribeEntities', () => {
      spotify_card_lib.doSubscribeEntities = jest.fn();
      spotify_card_lib.connectedCallback();
      expect(spotify_card_lib.doSubscribeEntities).toHaveBeenCalled();
    });
  });

  describe('disconnectedCallback', () => {
    test('_unsubscribe_entitites', () => {
      spotify_card_lib._unsubscribe_entitites = jest.fn();
      spotify_card_lib.disconnectedCallback();
      expect(spotify_card_lib._unsubscribe_entitites).toHaveBeenCalled();
    });
  });

  describe('doSubscribeEntities', () => {
    test('undefined', () => {
      expect(spotify_card_lib._unsubscribe_entitites).toBeUndefined();
    });
    test('undefined_with_connection', () => {
      spotify_card_lib.hass = jest.genMockFromModule<HomeAssistant>('home-assistant-js-websocket');
      spotify_card_lib.hass.connection = jest.genMockFromModule<Connection>('home-assistant-js-websocket');
      expect(spotify_card_lib._unsubscribe_entitites).toBeUndefined();
    });
    test('undefined_with_unsubscribe_entities', () => {
      spotify_card_lib.hass = jest.genMockFromModule<HomeAssistant>('home-assistant-js-websocket');
      spotify_card_lib.hass.connection = jest.genMockFromModule<Connection>('home-assistant-js-websocket');
      const mockFunction = jest.fn();
      spotify_card_lib._unsubscribe_entitites = mockFunction;
      expect(spotify_card_lib._unsubscribe_entitites).toBe(mockFunction);
    });
    // undefined_with_parent_connected
  });

  describe('entitiesUpdated', () => {
    beforeEach(() => {
      spotify_card_lib.config = jest.genMockFromModule<SpotifyCardConfig>('../types');
      spotify_card_lib._fetch_time_out = undefined;
    });
    test('media_player exists not', () => {
      const hass_entities = {
        other: jest.genMockFromModule<HassEntity>('home-assistant-js-websocket'),
      } as HassEntities;
      spotify_card_lib.entitiesUpdated(hass_entities);
      expect(spotify_card_lib._fetch_time_out).toBeUndefined();
    });
    test('media_player exists', () => {
      const hass_entities = {
        'media_player.other': jest.genMockFromModule<HassEntity>('home-assistant-js-websocket'),
      } as HassEntities;
      spotify_card_lib.entitiesUpdated(hass_entities);
      expect(spotify_card_lib._fetch_time_out).not.toBeUndefined();
      expect(spotify_card_lib._spotify_installed).toBeFalsy();
    });
    test('media_player.spotify exists', () => {
      const hass_entities = {
        'media_player.spotify': jest.genMockFromModule<HassEntity>('home-assistant-js-websocket'),
      } as HassEntities;
      spotify_card_lib.entitiesUpdated(hass_entities);
      expect(spotify_card_lib._fetch_time_out).not.toBeUndefined();
      expect(spotify_card_lib._spotify_installed).toBeTruthy();
    });
  });

  describe('checkIfAllowedToShow', () => {
    beforeEach(() => {
      spotify_card_lib.config = jest.genMockFromModule<SpotifyCardConfig>('../types');
      spotify_card_lib.config.filter_devices = undefined;
    });
    const connect_device = jest.genMockFromModule<ConnectDevice>('../types');
    connect_device.name = 'connect';
    const chromecast_device = jest.genMockFromModule<ChromecastDevice>('../types');
    chromecast_device.friendly_name = 'chromecast';
    test('no filter_devices set', () => {
      expect(spotify_card_lib.checkIfAllowedToShow(connect_device)).toBeTruthy();
      expect(spotify_card_lib.checkIfAllowedToShow(chromecast_device)).toBeTruthy();
    });
    test('filter_devices set empty', () => {
      spotify_card_lib.config.filter_devices = [];
      expect(spotify_card_lib.checkIfAllowedToShow(connect_device)).toBeTruthy();
      expect(spotify_card_lib.checkIfAllowedToShow(chromecast_device)).toBeTruthy();
    });
    test('filter_devices set not in list', () => {
      spotify_card_lib.config.filter_devices = ['other1', 'other'];
      expect(spotify_card_lib.checkIfAllowedToShow(connect_device)).toBeTruthy();
      expect(spotify_card_lib.checkIfAllowedToShow(chromecast_device)).toBeTruthy();
    });
    test('filter_devices set connect in list', () => {
      spotify_card_lib.config.filter_devices = ['connect', 'other'];
      expect(spotify_card_lib.checkIfAllowedToShow(connect_device)).toBeFalsy();
      expect(spotify_card_lib.checkIfAllowedToShow(chromecast_device)).toBeTruthy();
    });
    test('filter_devices set chromecast in list', () => {
      spotify_card_lib.config.filter_devices = ['chromecast', 'other'];
      expect(spotify_card_lib.checkIfAllowedToShow(connect_device)).toBeTruthy();
      expect(spotify_card_lib.checkIfAllowedToShow(chromecast_device)).toBeFalsy();
    });
    test('filter_devices set both in list', () => {
      spotify_card_lib.config.filter_devices = ['chromecast', 'connect', 'other'];
      expect(spotify_card_lib.checkIfAllowedToShow(connect_device)).toBeFalsy();
      expect(spotify_card_lib.checkIfAllowedToShow(chromecast_device)).toBeFalsy();
    });
    test('regex', () => {
      spotify_card_lib.config.filter_devices = ['.+ec.+'];
      const connect_device_2 = jest.genMockFromModule<ConnectDevice>('../types');
      connect_device_2.name = 'conn';
      const chromecast_device_2 = jest.genMockFromModule<ChromecastDevice>('../types');
      chromecast_device_2.friendly_name = 'chromast';
      expect(spotify_card_lib.checkIfAllowedToShow(connect_device)).toBeFalsy();
      expect(spotify_card_lib.checkIfAllowedToShow(chromecast_device)).toBeFalsy();
      expect(spotify_card_lib.checkIfAllowedToShow(connect_device_2)).toBeTruthy();
      expect(spotify_card_lib.checkIfAllowedToShow(chromecast_device_2)).toBeTruthy();
    });
  });

  describe('getFilteredDevices', () => {
    beforeEach(() => {
      spotify_card_lib.config = jest.genMockFromModule<SpotifyCardConfig>('../types');
      spotify_card_lib._spotcast_connector = jest.genMockFromModule<SpotcastConnector>('../spotcast-connector');
    });
    test('no devices set', () => {
      spotify_card_lib._spotcast_connector.devices = [];
      spotify_card_lib._spotcast_connector.chromecast_devices = [];
      expect(spotify_card_lib.getFilteredDevices()).toStrictEqual([[], []]);
    });
    test('connect devices set', () => {
      const connect_device = jest.genMockFromModule<ConnectDevice>('../types');
      spotify_card_lib._spotcast_connector.chromecast_devices = [];
      spotify_card_lib._spotcast_connector.devices = [connect_device];
      expect(spotify_card_lib.getFilteredDevices()).toStrictEqual([[connect_device], []]);
    });
    test('chromecast devices set', () => {
      const chromecast_device = jest.genMockFromModule<ChromecastDevice>('../types');
      spotify_card_lib._spotcast_connector.devices = [];
      spotify_card_lib._spotcast_connector.chromecast_devices = [chromecast_device];
      expect(spotify_card_lib.getFilteredDevices()).toStrictEqual([[], [chromecast_device]]);
    });
    test('both devices set', () => {
      const connect_device = jest.genMockFromModule<ConnectDevice>('../types');
      const chromecast_device = jest.genMockFromModule<ChromecastDevice>('../types');
      spotify_card_lib._spotcast_connector.devices = [connect_device];
      spotify_card_lib._spotcast_connector.chromecast_devices = [chromecast_device];
      expect(spotify_card_lib.getFilteredDevices()).toStrictEqual([[connect_device], [chromecast_device]]);
    });
    test('filtered both devices set', () => {
      const connect_device_1 = jest.genMockFromModule<ConnectDevice>('../types');
      connect_device_1.name = 'test';
      const connect_device_2 = jest.genMockFromModule<ConnectDevice>('../types');
      connect_device_2.name = 'filtered';
      const chromecast_device_1 = jest.genMockFromModule<ChromecastDevice>('../types');
      chromecast_device_1.friendly_name = 'test';
      const chromecast_device_2 = jest.genMockFromModule<ChromecastDevice>('../types');
      chromecast_device_2.friendly_name = 'filtered';
      spotify_card_lib._spotcast_connector.devices = [connect_device_1, connect_device_2];
      spotify_card_lib._spotcast_connector.chromecast_devices = [chromecast_device_1, chromecast_device_2];
      spotify_card_lib.config.filter_devices = ['filt.+'];
      expect(spotify_card_lib.getFilteredDevices()).toStrictEqual([[connect_device_1], [chromecast_device_1]]);
    });
  });
});
