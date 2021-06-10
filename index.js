const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const MAX_SEGMENTS = process.env.MAX_SEGMENTS || 100;
const PORT = process.env.PORT || 3001;
const app = express();

const tests = [
  {
    title: "Text color on buy button",
    hypothesis: "A more in depth description of the hypothesis",
    percentage: 100,
    split: 2,
    id: "3b3fcd1e-537d-43fc-8375-3bc5ddbf13a1",
  },
  {
    title: "Clear call to action A/B/C",
    hypothesis:
      "a mere clearer and 'to the point' call to action is going to boost sales with 10%",
    percentage: 50,
    split: 3,
    id: "374d2acb-1474-4d3c-b1bd-96c1e628b732",
  },
];

app.use(express.json());
app.use(cors());

const getOffset = (uuid) => {
  try {
    const res = uuid
      .split("-")
      .map((part) => parseInt(part, 16))
      .reduce((sum, val) => (sum + val) % Number.MAX_SAFE_INTEGER, 0);
    return res % Number.MAX_SAFE_INTEGER;
  } catch (e) {
    console.error(e);
    throw new Error("error parsing the segment id", e);
  }
};

const getSegmentsByPercentile = (percentile) => {
  return Math.floor((MAX_SEGMENTS * percentile) / 100);
};

const getOffsetPercentiles = (test) => {
  const offset = getOffset(test.id);
  const start = getSegmentsByPercentile(offset % MAX_SEGMENTS);
  const end = getSegmentsByPercentile(
    (test.percentage + offset) % MAX_SEGMENTS
  );

  console.log("getOffsetPercentiles", { offset, start, end });

  return { start, end };
};

const getGroupInTestBySegment = (segment, test) => {
  const groupSize = test.percentage / test.split;

  const groups = Array(test.split)
    .fill(0)
    .map((_, i) => {
      const { start, end } = getOffsetPercentiles(test);
      return {
        group: i,
        start: (start + groupSize * i) % MAX_SEGMENTS,
        end: (end + groupSize * (i + 1)) % MAX_SEGMENTS,
      };
    });

  const group = groups.find(({ start, end }) => {
    return isInRange({ segment, start, end });
  });

  console.log(groups);
  if (typeof group === "undefined") {
    throw new Error("somehow the segment was not part of the test percentile");
  }

  return group.group;
};

const isInRange = ({ segment, start, end }) => {
  if (start === end) {
    // 100%
    return true;
  }
  if (end < start) {
    // wrapped around
    return segment >= start || segment < end;
  }
  return segment >= start && segment < end;
};

const getActiveTestsForSegment = (segment) => {
  const testsForSegment = tests.filter((t) => {
    return isInRange({ segment, ...getOffsetPercentiles(t) });
  });

  return testsForSegment.map((t) => {
    return {
      ...t,
      group: getGroupInTestBySegment(segment, t),
      ...getOffsetPercentiles(t),
    };
  });
};

app.get("/", (req, res) => {
  res.json({
    version: "v1",
    message: "welcome",
    time: Date.now(),
  });
});

app.get("/tests/segment/:segmentId", (req, res) => {
  const segmentId = parseInt(req.params.segmentId, 10);
  if (segmentId > MAX_SEGMENTS) {
    throw new Error("Segment is out of range");
  }
  if (isNaN(segmentId)) {
    return res.status(400).json({
      error: "bad request",
      status: 400,
      message: "invalid segmentId",
    });
  }
  const activeTestsForSegment = getActiveTestsForSegment(segmentId);
  res.json(activeTestsForSegment);
});
app.get("/tests/all", (req, res) => {
  res.json(tests.map((t) => ({ ...t, ...getOffsetPercentiles(t) })));
});

app.post("/tests/new", (req, res) => {});

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});
