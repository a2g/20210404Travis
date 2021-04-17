import assert = require('assert');
import { GetDisplayName } from '../GetDisplayName';

describe("GetDisplayName", () => {
    it("TestAllNamesSoFar", () => {
        assert.equal("water", GetDisplayName("oWater"));
        assert.equal("giant amazonian lilypad", GetDisplayName("oGiantAmazonianLilypad"));
        assert.equal("floating object", GetDisplayName("oFloatingObject"));
        assert.equal("left cow leg", GetDisplayName("oLeftCowLeg"));
        assert.equal("right cow leg", GetDisplayName("oRightCowLeg"));
        assert.equal("left cow leg", GetDisplayName("iLeftCowLeg"));
        assert.equal("right cow leg", GetDisplayName("iRightCowLeg"));
        assert.equal("left cow femur", GetDisplayName("iLeftCowFemur"));
        assert.equal("right cow femur", GetDisplayName("iRightCowFemur"));
        assert.equal("skull", GetDisplayName("iSkull"));
        assert.equal("skull and bone1", GetDisplayName("iSkullAndBone1"));
        assert.equal("multibone1", GetDisplayName("iMultibone1"));
        assert.equal("skull and bone2", GetDisplayName("iSkullAndBone2"));
        assert.equal("multibone2", GetDisplayName("iMultibone2"));
    });
});
