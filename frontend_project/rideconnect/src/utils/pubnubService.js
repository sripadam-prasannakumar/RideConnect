import PubNub from 'pubnub';

const PUBLISH_KEY = 'pub-c-9cb28f84-cd48-42d5-a0e0-4abcd9b9b49b';
const SUBSCRIBE_KEY = 'sub-c-c7f42602-c002-4c0e-ac82-76901778f784';

export const RIDE_REQUESTS_CHANNEL = 'ride_requests';
export const RIDE_UPDATES_CHANNEL = 'ride_updates';

let pubnubInstance = null;

export const getPubNubInstance = (uuid) => {
    if (!uuid) return null;
    
    // If instance exists but UUID changed, reinitialize
    if (pubnubInstance && pubnubInstance.getUUID() !== uuid) {
        pubnubInstance.unsubscribeAll();
        pubnubInstance = null;
    }

    if (!pubnubInstance) {
        pubnubInstance = new PubNub({
            publishKey: PUBLISH_KEY,
            subscribeKey: SUBSCRIBE_KEY,
            userId: uuid,
            listenToBrowserNetworkEvents: true
        });
    }

    return pubnubInstance;
};
