// ---- Test subject
import {
  TwitterFollowerGT100Provider,
  TwitterFollowerGT500Provider,
  TwitterFollowerGTE1000Provider,
  TwitterFollowerGT5000Provider,
} from "./TwitterFollowerProvider";

import { RequestPayload } from "@gitcoin/passport-types";
import { auth, Client } from "twitter-api-sdk";
import { getAuthClient, getFollowerCount, TwitterFollowerResponse } from "./twitterOauth";

jest.mock("./twitterOauth", () => ({
  getFollowerCount: jest.fn(),
  getAuthClient: jest.fn(),
}));

const MOCK_TWITTER_CLIENT = new Client({} as auth.OAuth2User);

const MOCK_TWITTER_USER: TwitterFollowerResponse = {
  username: "DpoppDev",
  followerCount: 200,
};

const sessionKey = "twitter-myOAuthSession";
const code = "ABC123_ACCESSCODE";

beforeEach(() => {
  jest.clearAllMocks();
  (getAuthClient as jest.Mock).mockReturnValue(MOCK_TWITTER_CLIENT);
});

describe("Attempt verification", function () {
  it("handles valid verification attempt", async () => {
    (getFollowerCount as jest.Mock).mockResolvedValue(MOCK_TWITTER_USER);

    const twitter = new TwitterFollowerGT100Provider();
    const verifiedPayload = await twitter.verify(
      {
        proofs: {
          sessionKey,
          code,
        },
      } as unknown as RequestPayload,
      {}
    );

    expect(getAuthClient).toBeCalledWith(sessionKey, code, {});
    expect(getFollowerCount).toBeCalled();
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        username: "DpoppDev",
        followerCount: "gt100",
      },
    });
  });

  it("should return invalid payload when there is no username in requestFindMyUser response", async () => {
    (getFollowerCount as jest.Mock).mockResolvedValue({ username: undefined });

    const twitter = new TwitterFollowerGT100Provider();

    const verifiedPayload = await twitter.verify(
      {
        proofs: {
          sessionKey,
          code,
        },
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when requestFindMyUser throws", async () => {
    (getFollowerCount as jest.Mock).mockRejectedValue("unauthorized");

    const twitter = new TwitterFollowerGT100Provider();

    const verifiedPayload = await twitter.verify(
      {
        proofs: {
          sessionKey,
          code,
        },
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toMatchObject({ valid: false });
  });

  describe("Check invalid cases for follower ranges", function () {
    it("Expected Greater than 100 and Follower Count is 50", async () => {
      (getFollowerCount as jest.Mock).mockResolvedValue({ username: "DpoppDev", followerCount: 50 });

      const twitter = new TwitterFollowerGT100Provider();

      const verifiedPayload = await twitter.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {}
      );

      expect(verifiedPayload).toMatchObject({ valid: false });
    });

    it("Expected Greater than 500 and Follower Count is 150", async () => {
      (getFollowerCount as jest.Mock).mockResolvedValue({ username: "DpoppDev", followerCount: 150 });

      const twitter = new TwitterFollowerGT500Provider();

      const verifiedPayload = await twitter.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {}
      );

      expect(verifiedPayload).toMatchObject({ valid: false });
    });

    it("Expected Greater than or equal to 1000 and Follower Count is 900", async () => {
      (getFollowerCount as jest.Mock).mockResolvedValue({ username: "DpoppDev", followerCount: 900 });

      const twitter = new TwitterFollowerGTE1000Provider();

      const verifiedPayload = await twitter.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {}
      );

      expect(verifiedPayload).toMatchObject({ valid: false });
    });

    it("Expected Greater than 5000 and Follower Count is 2500", async () => {
      (getFollowerCount as jest.Mock).mockResolvedValue({ username: "DpoppDev", followerCount: 2500 });

      const twitter = new TwitterFollowerGT5000Provider();

      const verifiedPayload = await twitter.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {}
      );

      expect(verifiedPayload).toMatchObject({ valid: false });
    });
  });
  describe("Check valid cases for follower ranges", function () {
    it("Expected Greater than 100 and Follower Count is 150", async () => {
      (getFollowerCount as jest.Mock).mockResolvedValue({ username: "DpoppDev", followerCount: 150 });

      const twitter = new TwitterFollowerGT100Provider();

      const verifiedPayload = await twitter.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {}
      );

      expect(verifiedPayload).toMatchObject({ valid: true });
    });

    it("Expected Greater than 500 and Follower Count is 700", async () => {
      (getFollowerCount as jest.Mock).mockResolvedValue({ username: "DpoppDev", followerCount: 700 });

      const twitter = new TwitterFollowerGT500Provider();

      const verifiedPayload = await twitter.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {}
      );

      expect(verifiedPayload).toMatchObject({ valid: true });
    });

    it("Expected Greater than or equal to 1000 and Follower Count is 1500", async () => {
      (getFollowerCount as jest.Mock).mockResolvedValue({ username: "DpoppDev", followerCount: 1500 });

      const twitter = new TwitterFollowerGTE1000Provider();

      const verifiedPayload = await twitter.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {}
      );

      expect(verifiedPayload).toMatchObject({ valid: true });
    });

    it("Expected Greater than 5000 and Follower Count is 7500", async () => {
      (getFollowerCount as jest.Mock).mockResolvedValue({ username: "DpoppDev", followerCount: 7500 });

      const twitter = new TwitterFollowerGT5000Provider();

      const verifiedPayload = await twitter.verify(
        {
          proofs: {
            sessionKey,
            code,
          },
        } as unknown as RequestPayload,
        {}
      );

      expect(verifiedPayload).toMatchObject({ valid: true });
    });
  });

  it("should return invalid payload when unable to retrieve twitter oauth client", async () => {
    (getAuthClient as jest.Mock).mockRejectedValue("Error");
    (getFollowerCount as jest.Mock).mockImplementationOnce(async (client) => {
      return Promise.resolve(client ? MOCK_TWITTER_USER : {});
    });

    const twitter = new TwitterFollowerGT100Provider();

    const verifiedPayload = await twitter.verify(
      {
        proofs: {
          sessionKey,
          code,
        },
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toMatchObject({ valid: false });
  });
});
