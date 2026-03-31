import PubNub from 'pubnub';

const PUBLISH_KEY = 'pub-c-786fb45d-17ef-4907-960f-b5fd95bf44f7';
const SUBSCRIBE_KEY = 'sub-c-668fd095-f346-4f4d-ad7e-819f9ee36ce6';

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
