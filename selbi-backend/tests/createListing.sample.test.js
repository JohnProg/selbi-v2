import { expect } from 'chai';
import GeoFire from 'geofire';
import FirebaseTest, { testUserUid } from '@selbi/firebase-test-resource';

/*
 * This code snippet demonstrates how to create a listing for a user.
 *
 * A listing is automatically created in the inactive status. The user can then later move the
 * listing to be publicly or privately viewable.
 *
 * The listing can be in 3 places :
 * - The /listings endpoints which holds all listing data
 * - The /geolistings endpoint which indexes location->listing.
 * - The /userListings endpoint which indexes user+status->listing
 *
 * However, at creation it is created as inactive an as such, is not added to geolistings.
 *
 * @param title String title of the listing, input by user.
 * @param description String description of the listing, input by user.
 * @param price Number price in dollars of the listing, input by user,
 * @param images Array of image objects for this listing. This includes imageId the pointer to the
 * /image as well as height and width.
 * @param category String category of the listing, input by user.
 * @param uid String user id of the seller, pulled from firebase auth by the app.
 * @param firebaseDb We pass in the database in this sample test.
 *
 * @returns Promise fulfilled with the listing data if created successfully.
 */
function createListing(titleInput,
                       descriptionInput,
                       priceInput,
                       imagesInput,
                       categoryInput,
                       uid,
                       firebaseDb) {
  // TODO: Add validation of args for cleaner failures.

  const listing = {
    title: titleInput,
    description: descriptionInput,
    price: priceInput,
    images: imagesInput,
    category: categoryInput,
    sellerId: uid,
    status: 'inactive',
  };

  // Get an id for the new listing.
  const newListingRef = firebaseDb.ref('/listings').push();

  const createUserListing = () => firebaseDb
    .ref('/userListings')
    .child(uid)
    .child('inactive')
    .child(newListingRef.key)
    .set(true);

  return newListingRef
    .set(listing)
    .then(createUserListing)
    .then(() => Promise.resolve(newListingRef.key));
}

/*
 * This code snippet shows how to load a single listing from the db once you have the listing's id.
 *
 * @param listingId String id of the listing to load.
 * @param firebaseDb We pass in the database in this sample test.
 *
 * @returns Promise fulfilled with DataSnapshot of the listing if the listing exists.
 */
function loadListingData(listingId, firebaseDb) {
  return firebaseDb
    .ref('/listings')
    .child(listingId)
    .once('value');
}

/*
 * This code snippet shows how to load listings based on the status, for example, load all private
 * listings for a given user.
 *
 * This is useful for loading listings of users a user is following by first loading the user's
 * friends and then loading their public and private listings. It's also useful for loading a
 * user's inventory of listings.
 *
 * Note that this will fail if ANY listing fails to load.
 *
 * @param status String status of listings to load. Must be inactive, public, private, sold,
 * salePending.
 * @param uid String user id of the user whose listings to load.
 * @param firebaseDb We pass in the database in this sample test.
 *
 * @returns Promise fulfilled with list of listings of a given status.
 */
function loadListingsByStatus(status, uid, firebaseDb) {
  return firebaseDb
    .ref('/userListings')
    .child(uid)
    .child(status)
    .once('value')
    .then((snapshot) => {
      if (snapshot.exists()) {
        return Promise.resolve(snapshot.val());
      }
      return Promise.resolve({});
    })
    .then((listingsOfStatus) => {
      const allListings = [];
      Object.keys(listingsOfStatus)
        .forEach((listingId) => {
          allListings.push(
            firebaseDb
              .ref('/listings')
              .child(listingId)
              .once('value'));
        });
      return Promise.all(allListings);
    });
}

/*
 * This code snippet demonstrates how to load all public listings at a certain location.
 *
 * This is useful for the 'nearby-listings' view for listings within X km of the user. See
 * https://github.com/firebase/geofire-js/blob/master/docs/reference.md for more info about GeoFire.
 *
 * Note that this will fail if ANY listing fails to load.
 *
 * @param latlon Array of [lat, lon], pulled from user device (either address or device location).
 * @param radiusKm Number of km radius to search around latlon.
 * @param firebaseDb We pass in the database in this sample test.
 *
 * @return Promise fulfilled with list of listing DataSnapshots.
 */
function loadListingByLocation(latlon, radiusKm, firebaseDb) {
  const geoListings = new GeoFire(firebaseDb.ref('/geolistings'));

  const geoQuery = geoListings.query({
    center: latlon,
    radius: radiusKm,
  });

  return new Promise((fulfill) => {
    const listingsInArea = [];
    const loadListingsPromises = [];

    geoQuery.on('key_entered', (listingId) => {
      // Once we know the listing id of a listing in the area, start loading the listing data.
      loadListingsPromises.push(
        loadListingData(listingId, firebaseDb)
          .then((snapshot) => {
            if (snapshot.exists()) {
              listingsInArea.push(snapshot);
            }
          }));
    });

    // Ready is called once all pre-existing data has been read.
    geoQuery.on('ready', () => {
      geoQuery.cancel();

      // Now wait on loading the actual listing data.
      Promise.all(loadListingsPromises)
        .then(() => {
          fulfill(listingsInArea);
        });
    });
  });
}

/*
 * This code snippet demonstrates how to change the status of a user's listing.
 *
 * This is useful when a user published a listing for any other local user to see or when they
 * want to depublish a listing.
 *
 * Note that the performance of this could be by knowing the prior status of the listing. We have
 * avoided fully parallelizing updating the /listings/$listingId/status because that should serve
 * as the source of truth. By waiting, we know that if that update fails, none of the secondary
 * indexes will be corrupted.
 *
 * @param {string} newStatus String new status for the listing.
 * @param {string} listingId String id of the listing to make public.
 * @param {FirebaseDatabase} firebaseDb We pass in the database in this sample test.
 * @param {Array of [lat, lon]} latlon for the newly public object, pulled from app location or
 * user input address.
 *
 * @returns DataSnapshot of the old listing prior to updating the status.
 */
function changeListingStatus(newStatus, listingId, firebaseDb, latlon) {
  // Start by loading the existing snapshot and verifying it exists.
  return firebaseDb
    .ref('listings')
    .child(listingId)
    .once('value')
    .then((snapshot) => {
      if (snapshot.exists()) {
        // Update status on /listing data.
        return firebaseDb
          .ref('listings')
          .child(listingId)
          .update({
            status: newStatus,
          })
          .then(() => Promise.resolve(snapshot));
      }
      throw new Error('No such listing.');
    })
    .then((oldSnapshot) => {
      const allUpdatePromises = [];

      allUpdatePromises.push(firebaseDb
        .ref('/userListings')
        .child(oldSnapshot.val().sellerId)
        .child(oldSnapshot.val().status)
        .child(listingId)
        .remove());

      allUpdatePromises.push(firebaseDb
        .ref('/userListings')
        .child(oldSnapshot.val().sellerId)
        .child(newStatus)
        .child(listingId)
        .set(true));

      if (newStatus === 'public') {
        allUpdatePromises.push(new GeoFire(firebaseDb.ref('/geolistings'))
          .set(listingId, latlon));
      } else {
        allUpdatePromises.push(new GeoFire(firebaseDb.ref('/geolistings'))
          .remove(listingId));
      }

      return Promise.all(allUpdatePromises)
        .then(() => Promise.resolve(oldSnapshot));
    });
}

describe('Listing Samples', () => {
  beforeEach(function (done) {
    this.timeout(25000);

    const createTestUser = () => FirebaseTest
      .testUserApp
      .database()
      .ref('/users')
      .child(testUserUid)
      .set(FirebaseTest.getMinimalUserData());

    FirebaseTest
      .dropDatabase()
      .then(createTestUser)
      .then(done)
      .catch(done);
  });

  function createTestUserListing(title) {
    return createListing(title,
      'desc',
      4.5,
      [{
        imageId: 'first-image-id',
        height: 20,
        width: 30,
      }],
      'category',
      testUserUid,
      FirebaseTest.testUserApp.database());
  }

  it('create new listing', (done) => {
    createTestUserListing('title')
      .then((listingId) => loadListingData(listingId, FirebaseTest.testUserApp.database()))
      .then((snapshot) => {
        expect(snapshot.val().title).to.equal('title');
      })
      .then(done)
      .catch(done);
  });

  it('can load listings by status', (done) => {
    createTestUserListing('listing 1')
      .then(() => createTestUserListing('listing 2'))
      .then(() => loadListingsByStatus(
        'inactive',
        testUserUid,
        FirebaseTest.testUserApp.database()))
      .then((results) => {
        expect(results.length).to.equal(2);
        const resultTitles = [results[0].val().title, results[1].val().title];
        expect(resultTitles).contains('listing 1');
        expect(resultTitles).contains('listing 2');
      })
      .then(done)
      .catch(done);
  });

  it('can change listing to public and load by location', function (done) {
    this.timeout(5000);

    // Create the listing as testUser.
    createTestUserListing('listing 1')
      // Use the testUser db to make the listing public.
      .then((newListingId) => changeListingStatus('public',
        newListingId,
        FirebaseTest.testUserApp.database(),
        [37.79, -122.41]))
      // Use minimalUser db to load listing by location.
      .then(() => loadListingByLocation(
        [37.79, -122.41],
        10,
        FirebaseTest.minimalUserApp.database()))
      .then((results) => {
        expect(results.length).to.equal(1);
        expect(results[0].val().title).to.equal('listing 1');
      })
      .then(done)
      .catch(done);
  });

  it('can load empty list for location if no listing exists', (done) => {
    loadListingByLocation(
      [37.79, -122.41],
      10,
      FirebaseTest.minimalUserApp.database())
      .then((results) => {
        expect(results.length).to.equal(0);
      })
      .then(done)
      .catch(done);
  });

  it('can change to public then change back to private', function (done) {
    this.timeout(5000);

    // Create the listing as testUser.
    createTestUserListing('listing 1')
    // Use the testUser db to make the listing public.
      .then((newListingId) => changeListingStatus('public',
        newListingId,
        FirebaseTest.testUserApp.database(),
        [37.79, -122.41]))
      .then((oldListingSnapshot) => changeListingStatus('private',
        oldListingSnapshot.key,
        FirebaseTest.testUserApp.database()))
      .then(() => loadListingsByStatus('private',
          testUserUid,
          FirebaseTest.testUserApp.database()))
      .then((results) => {
        expect(results.length).to.equal(1);
        expect(results[0].val().title).to.equal('listing 1');
      })
      .then(() => loadListingByLocation(
        [37.79, -122.41],
        10,
        FirebaseTest.minimalUserApp.database()))
      .then((results) => {
        expect(results.length).to.equal(0);
      })
      .then(done)
      .catch(done);
  });

  it('can change to public then change back to inactive', function (done) {
    this.timeout(5000);

    // Create the listing as testUser.
    createTestUserListing('listing 1')
    // Use the testUser db to make the listing public.
      .then((newListingId) => changeListingStatus('public',
        newListingId,
        FirebaseTest.testUserApp.database(),
        [37.79, -122.41]))
      .then((oldListingSnapshot) => changeListingStatus('inactive',
        oldListingSnapshot.key,
        FirebaseTest.testUserApp.database()))
      .then(() => loadListingsByStatus('inactive',
        testUserUid,
        FirebaseTest.testUserApp.database()))
      .then((results) => {
        expect(results.length).to.equal(1);
        expect(results[0].val().title).to.equal('listing 1');
      })
      .then(() => loadListingByLocation(
        [37.79, -122.41],
        10,
        FirebaseTest.minimalUserApp.database()))
      .then((results) => {
        expect(results.length).to.equal(0);
      })
      .then(done)
      .catch(done);
  });

  it('can change from inactive to private', function (done) {
    this.timeout(5000);

    // Create the listing as testUser.
    createTestUserListing('listing 1')
    // Use the testUser db to make the listing public.
      .then((newListingId) => changeListingStatus('private',
        newListingId,
        FirebaseTest.testUserApp.database()))
      .then(() => loadListingsByStatus('private',
        testUserUid,
        FirebaseTest.testUserApp.database()))
      .then((results) => {
        expect(results.length).to.equal(1);
        expect(results[0].val().title).to.equal('listing 1');
      })
      .then(() => loadListingByLocation(
        [37.79, -122.41],
        10,
        FirebaseTest.minimalUserApp.database()))
      .then((results) => {
        expect(results.length).to.equal(0);
      })
      .then(done)
      .catch(done);
  });
});
