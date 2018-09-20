import nock from 'nock';

export default function() {
  nock('http://api.meetup.com:80')
    .get('/opencollective/events')
    .query({ key: '620459537f4174273a5d4g535321445' })
    .reply(
      200,
      [
        {
          created: 1473192846000,
          duration: 7200000,
          id: '233920949',
          name: 'Funding for your meetup',
          status: 'upcoming',
          time: 1474498800000,
          updated: 1473691287000,
          utc_offset: -14400000,
          waitlist_count: 0,
          yes_rsvp_count: 7,
          venue: {
            id: 24481681,
            name: 'Belgian Beer Cafe ',
            lat: 40.74344253540039,
            lon: -73.98820495605469,
            repinned: false,
            address_1: '220 5th Ave (Corner of 26th Street)',
            city: 'New York',
            country: 'us',
            localized_country_name: 'USA',
            zip: '',
            state: 'NY',
          },
          collective: {
            created: 1467307564000,
            name: 'Open Collective',
            id: 20132146,
            join_mode: 'open',
            lat: 40.75,
            lon: -73.98999786376953,
            urlname: 'opencollective',
            who: 'Members',
          },
          link: 'http://www.meetup.com/opencollective/events/233920949/',
          description:
            "<p>We'll share how meetups are currently using OpenCollective to raise money - through donations and/or memberships - and increasing their impact on the world.</p> <p>Also a good chance to meet our core team - Xavier, Pia and Aseem.</p> ",
          visibility: 'public',
        },
      ],
      {
        date: 'Mon, 12 Sep 2016 14:43:23 GMT',
        'content-type': 'application/json;charset=utf-8',
        'transfer-encoding': 'chunked',
        connection: 'close',
        'set-cookie': [
          '__cfduid=d2a176f04649720fd85f91321cd2b4d071473691403; expires=Tue, 12-Sep-17 14:43:23 GMT; path=/; domain=.meetup.com; HttpOnly',
        ],
        'x-meetup-server': 'api3',
        'x-meetup-request-id': '356e718b-a217-4130-acf4-4d002bd7f4c6',
        'x-oauth-scopes': 'basic',
        'x-accepted-oauth-scopes': 'basic',
        'x-ratelimit-limit': '30',
        'x-ratelimit-remaining': '29',
        'x-ratelimit-reset': '10',
        'x-total-count': '1',
        etag: 'W/"c31254ee5db2d70c47805b3b3de6c3e9"',
        vary: 'Accept-Encoding,User-Agent,Accept-Language',
        server: 'cloudflare-nginx',
        'cf-ray': '2e1421a93bea0c0b-AMS',
      },
    );

  nock('http://api.meetup.com:80')
    .post(
      '/2/event/233920949',
      'description=%3Cp%3EThank%20you%20to%20our%20sponsors%20Gitlab%20and%20%3Ca%20href%3D%22https%3A%2F%2Fgithub.com%22%3EGithub%3C%2Fa%3E%3C%2Fp%3E%20%3Cp%3E%3Ca%20href%3D%22https%3A%2F%2Fopencollective.com%2Fopencollective%23sponsors%22%3E%3Cimg%20src%3D%22https%3A%2F%2Fopencollective.com%2Fopencollective%2Fsponsors.png%3Fwidth%3D700%22%3E%3C%2Fa%3E%3C%2Fp%3E%20%3Cp%3EWe%27ll%20share%20how%20meetups%20are%20currently%20using%20OpenCollective%20to%20raise%20money%20-%20through%20donations%20and%2For%20memberships%20-%20and%20increasing%20their%20impact%20on%20the%20world.%3C%2Fp%3E%20%3Cp%3EAlso%20a%20good%20chance%20to%20meet%20our%20core%20team%20-%20Xavier%2C%20Pia%20and%20Aseem.%3C%2Fp%3E%20',
    )
    .query({ key: '620459537f4174273a5d4g535321445' })
    .reply(
      200,
      {
        utc_offset: -14400000,
        venue: {
          country: 'us',
          localized_country_name: 'USA',
          city: 'New York',
          address_1: '220 5th Ave (Corner of 26th Street)',
          name: 'Belgian Beer Cafe ',
          lon: -73.988205,
          id: 24481681,
          state: 'NY',
          lat: 40.743443,
          repinned: false,
        },
        headcount: 0,
        visibility: 'public',
        waitlist_count: 0,
        created: 1473192846000,
        maybe_rsvp_count: 0,
        description:
          '<p>Thank you to our sponsors Gitlab and <a href="https://github.com">Github</a></p> <p><a href="https://opencollective.com/opencollective#sponsors"><a href="https://opencollective.com/opencollective/sponsors.png?width=700" class="linkified">https://opencollective.com/opencollective/sponsors.png?width=700</a></a></p> <p>We\'ll share how meetups are currently using OpenCollective to raise money - through donations and/or memberships - and increasing their impact on the world.</p> <p>Also a good chance to meet our core team - Xavier, Pia and Aseem.</p>',
        event_url: 'http://www.meetup.com/opencollective/events/233920949/',
        yes_rsvp_count: 7,
        duration: 7200000,
        announced: true,
        name: 'Funding for your meetup',
        id: '233920949',
        simple_html_description:
          'Thank you to our sponsors Gitlab and <a href="https://github.com">Github</a>\n\n<a href="https://opencollective.com/opencollective#sponsors">https://opencollective.com/opencollective/sponsors.png?width=700</a>\n\nWe\'ll share how meetups are currently using OpenCollective to raise money - through donations and/or memberships - and increasing their impact on the world.\n\nAlso a good chance to meet our core team - Xavier, Pia and Aseem.',
        time: 1474498800000,
        updated: 1473691404000,
        collective: {
          join_mode: 'open',
          created: 1467307564000,
          name: 'Open Collective',
          collective_lon: -73.98999786376953,
          id: 20132146,
          urlname: 'opencollective',
          collective_lat: 40.75,
          who: 'Members',
        },
        status: 'upcoming',
      },
      {
        date: 'Mon, 12 Sep 2016 14:43:24 GMT',
        'content-type': 'application/json;charset=utf-8',
        'transfer-encoding': 'chunked',
        connection: 'close',
        'set-cookie': [
          '__cfduid=d92f314288e3b9ba6bfd28845e34633781473691404; expires=Tue, 12-Sep-17 14:43:24 GMT; path=/; domain=.meetup.com; HttpOnly',
        ],
        'x-meetup-server': 'api12',
        'x-meetup-request-id': '0db39bd0-c3d2-405e-aa2f-c6f001a87ab4',
        'x-ratelimit-limit': '30',
        'x-ratelimit-remaining': '28',
        'x-ratelimit-reset': '10',
        'x-oauth-scopes': 'basic',
        'x-accepted-oauth-scopes': 'basic',
        vary: 'Accept-Encoding,User-Agent,Accept-Language',
        server: 'cloudflare-nginx',
        'cf-ray': '2e1421ab664d02de-AMS',
      },
    );

  nock('http://api.meetup.com:80')
    .get('/opencollective/events')
    .query({ key: '620459537f4174273a5d4g535321445' })
    .reply(
      200,
      [
        {
          created: 1473192846000,
          duration: 7200000,
          id: '233920949',
          name: 'Funding for your meetup',
          status: 'upcoming',
          time: 1474498800000,
          updated: 1473691404000,
          utc_offset: -14400000,
          waitlist_count: 0,
          yes_rsvp_count: 7,
          venue: {
            id: 24481681,
            name: 'Belgian Beer Cafe ',
            lat: 40.74344253540039,
            lon: -73.98820495605469,
            repinned: false,
            address_1: '220 5th Ave (Corner of 26th Street)',
            city: 'New York',
            country: 'us',
            localized_country_name: 'USA',
            zip: '',
            state: 'NY',
          },
          collective: {
            created: 1467307564000,
            name: 'Open Collective',
            id: 20132146,
            join_mode: 'open',
            lat: 40.75,
            lon: -73.98999786376953,
            urlname: 'opencollective',
            who: 'Members',
          },
          link: 'http://www.meetup.com/opencollective/events/233920949/',
          description:
            '<p>Thank you to our sponsors Gitlab and <a href="https://github.com">Github</a></p> <p><a href="https://opencollective.com/opencollective#sponsors"><a href="https://opencollective.com/opencollective/sponsors.png?width=700" class="linkified">https://opencollective.com/opencollective/sponsors.png?width=700</a></a></p> <p>We\'ll share how meetups are currently using OpenCollective to raise money - through donations and/or memberships - and increasing their impact on the world.</p> <p>Also a good chance to meet our core team - Xavier, Pia and Aseem.</p> ',
          visibility: 'public',
        },
      ],
      {
        date: 'Mon, 12 Sep 2016 14:43:24 GMT',
        'content-type': 'application/json;charset=utf-8',
        'transfer-encoding': 'chunked',
        connection: 'close',
        'set-cookie': [
          '__cfduid=d4483673cb44a706cc99dc8266d5b6d991473691404; expires=Tue, 12-Sep-17 14:43:24 GMT; path=/; domain=.meetup.com; HttpOnly',
        ],
        'x-meetup-server': 'api14',
        'x-meetup-request-id': 'eec32948-33fe-4b4f-9405-2a3067cb8a06',
        'x-oauth-scopes': 'basic',
        'x-accepted-oauth-scopes': 'basic',
        'x-ratelimit-limit': '30',
        'x-ratelimit-remaining': '27',
        'x-ratelimit-reset': '9',
        'x-total-count': '1',
        etag: 'W/"aaa883589887892594e2d1d8030e7fc9"',
        vary: 'Accept-Encoding,User-Agent,Accept-Language',
        server: 'cloudflare-nginx',
        'cf-ray': '2e1421af13220c89-AMS',
      },
    );

  nock('http://api.meetup.com:80')
    .post(
      '/2/event/233920949',
      'description=%3Cp%3EWe%27ll%20share%20how%20meetups%20are%20currently%20using%20OpenCollective%20to%20raise%20money%20-%20through%20donations%20and%2For%20memberships%20-%20and%20increasing%20their%20impact%20on%20the%20world.%3C%2Fp%3E%20%3Cp%3EAlso%20a%20good%20chance%20to%20meet%20our%20core%20team%20-%20Xavier%2C%20Pia%20and%20Aseem.%3C%2Fp%3E%20',
    )
    .query({ key: '620459537f4174273a5d4g535321445' })
    .reply(
      200,
      {
        utc_offset: -14400000,
        venue: {
          country: 'us',
          localized_country_name: 'USA',
          city: 'New York',
          address_1: '220 5th Ave (Corner of 26th Street)',
          name: 'Belgian Beer Cafe ',
          lon: -73.988205,
          id: 24481681,
          state: 'NY',
          lat: 40.743443,
          repinned: false,
        },
        headcount: 0,
        visibility: 'public',
        waitlist_count: 0,
        created: 1473192846000,
        maybe_rsvp_count: 0,
        description:
          "<p>We'll share how meetups are currently using OpenCollective to raise money - through donations and/or memberships - and increasing their impact on the world.</p> <p>Also a good chance to meet our core team - Xavier, Pia and Aseem.</p>",
        event_url: 'http://www.meetup.com/opencollective/events/233920949/',
        yes_rsvp_count: 7,
        duration: 7200000,
        announced: true,
        name: 'Funding for your meetup',
        id: '233920949',
        simple_html_description:
          "We'll share how meetups are currently using OpenCollective to raise money - through donations and/or memberships - and increasing their impact on the world.\n\nAlso a good chance to meet our core team - Xavier, Pia and Aseem.",
        time: 1474498800000,
        updated: 1473691405000,
        collective: {
          join_mode: 'open',
          created: 1467307564000,
          name: 'Open Collective',
          collective_lon: -73.98999786376953,
          id: 20132146,
          urlname: 'opencollective',
          collective_lat: 40.75,
          who: 'Members',
        },
        status: 'upcoming',
      },
      {
        date: 'Mon, 12 Sep 2016 14:43:25 GMT',
        'content-type': 'application/json;charset=utf-8',
        'transfer-encoding': 'chunked',
        connection: 'close',
        'set-cookie': [
          '__cfduid=d2a87cdbd699c46c9499b49a7c006e4311473691404; expires=Tue, 12-Sep-17 14:43:24 GMT; path=/; domain=.meetup.com; HttpOnly',
        ],
        'x-meetup-server': 'api16',
        'x-meetup-request-id': '5fb0c016-0690-4230-aae5-94ca4e3dd529',
        'x-ratelimit-limit': '30',
        'x-ratelimit-remaining': '26',
        'x-ratelimit-reset': '9',
        'x-oauth-scopes': 'basic',
        'x-accepted-oauth-scopes': 'basic',
        vary: 'Accept-Encoding,User-Agent,Accept-Language',
        server: 'cloudflare-nginx',
        'cf-ray': '2e1421b104620c5f-AMS',
      },
    );
}
