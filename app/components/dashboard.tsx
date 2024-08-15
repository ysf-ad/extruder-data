import { Data, Layout } from 'plotly.js';
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Row, Col, Card, Table, Form, Alert, Pagination  } from 'react-bootstrap';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// Dynamically import Plotly
const Plot = lazy(() => import('react-plotly.js'));

interface DashboardProps {
  data: any[];
  dataType: string;
}

export default function Dashboard({ data, dataType }: DashboardProps) {
  const [filteredData, setFilteredData] = useState(data);
  const [excludedPoints, setExcludedPoints] = useState<number[]>([]);
  const [lowerThreshold, setLowerThreshold] = useState(-Infinity);
  const [upperThreshold, setUpperThreshold] = useState(Infinity);
  const [excludeWithinThreshold, setExcludeWithinThreshold] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");
  const [actualColumnName, setActualColumnName] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [additionalLine1, setAdditionalLine1] = useState(1.73);
  const [additionalLine2, setAdditionalLine2] = useState(1.77);
  const [excludeFirst, setExcludeFirst] = useState(300);
  const [excludeLast, setExcludeLast] = useState(300);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!data || data.length === 0) {
      setError("No data available");
      return;
    }

    const columnPattern = new RegExp(`^${dataType}(?!Y).*$`, 'i');
    const matchingColumn = Object.keys(data[0]).find(key => columnPattern.test(key));

    if (!matchingColumn) {
      setError(`Data type '${dataType}' not found in CSV`);
      return;
    }

    setActualColumnName(matchingColumn);
    setError("");
    updateFilteredData(data, matchingColumn, lowerThreshold, upperThreshold, excludedPoints, excludeWithinThreshold, excludeFirst, excludeLast);
  }, [data, dataType, lowerThreshold, upperThreshold, excludedPoints, excludeWithinThreshold, excludeFirst, excludeLast]);

  const updateFilteredData = (data: any[], column: string, lower: number, upper: number, excluded: number[], excludeWithin: boolean, first: number, last: number) => {
    const rangeFiltered = data.slice(first, data.length - last);
    const moduloFactor = Math.max(1, Math.floor(rangeFiltered.length / 10000));
    
    const filtered = rangeFiltered.filter((item: any, index: number) => {
      const value = parseFloat(item[column]);
      const withinThreshold = value >= lower && value <= upper;
      return !isNaN(value) && 
             !excluded.includes(index) && 
             (excludeWithin ? !withinThreshold : withinThreshold) &&
             index % moduloFactor === 0;  // Modulo sampling
    });
    
    setFilteredData(filtered);
  };

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  const statistics = calculateStatistics(filteredData.map((item: any) => parseFloat(item[actualColumnName])));

  const handleLowerThresholdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLowerThreshold(parseFloat(event.target.value));
  };

  const handleUpperThresholdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUpperThreshold(parseFloat(event.target.value));
  };

  const handleExcludeWithinThresholdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setExcludeWithinThreshold(event.target.checked);
  };

  const handleAdditionalLine1Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAdditionalLine1(parseFloat(event.target.value));
  };

  const handleAdditionalLine2Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAdditionalLine2(parseFloat(event.target.value));
  };

  const handleExcludeFirstChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setExcludeFirst(parseInt(event.target.value));
  };

  const handleExcludeLastChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setExcludeLast(parseInt(event.target.value));
  };

  const getPageItems = () => {
    const items = [];
    const maxPagesToShow = 5; // Adjust this number to show more or fewer page numbers

    items.push(
      <Pagination.First key="first" onClick={() => handlePageChange(1)} disabled={currentPage === 1} />,
      <Pagination.Prev key="prev" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
    );

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
      items.push(<Pagination.Ellipsis key="ellipsis-start" />);
    }

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item key={page} active={page === currentPage} onClick={() => handlePageChange(page)}>
          {page}
        </Pagination.Item>
      );
    }

    if (endPage < totalPages) {
      items.push(<Pagination.Ellipsis key="ellipsis-end" />);
    }

    items.push(
      <Pagination.Next key="next" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />,
      <Pagination.Last key="last" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
    );

    return items;
  };


  // Prepare data for Plotly chart
  const xValues = filteredData.map((item, index) => index + 1);
  const yValues = filteredData.map(item => parseFloat(item[actualColumnName]));

  const plotlyData: Data[] = [
    {
      type: 'scatter',
      x: xValues,
      y: yValues,
      mode: 'lines+markers',
      name: 'Data',
      showlegend: true,
      hoverinfo: 'all',
      line: { color: 'blue', width: 2 },
      marker: { color: 'blue', size: 8, symbol: 'circle' }
    },
    {
      type: 'scatter',
      x: [Math.min(...xValues), Math.max(...xValues)],
      y: [statistics.lcl, statistics.lcl],
      mode: 'lines',
      name: 'LCL',
      showlegend: true,
      line: { color: 'red', width: 2 }
    },
    {
      type: 'scatter',
      x: [Math.min(...xValues), Math.max(...xValues)],
      y: [statistics.ucl, statistics.ucl],
      mode: 'lines',
      name: 'UCL',
      showlegend: true,
      line: { color: 'red', width: 2 }
    },
    {
      type: 'scatter',
      x: [Math.min(...xValues), Math.max(...xValues)],
      y: [statistics.mean, statistics.mean],
      mode: 'lines',
      name: 'Centerline',
      showlegend: true,
      line: { color: 'grey', width: 2 }
    },
    {
      type: 'scatter',
      x: [Math.min(...xValues), Math.max(...xValues)],
      y: [1.75, 1.75],
      mode: 'lines',
      name: 'Reference (1.75)',
      showlegend: true,
      line: { color: 'black', width: 3 }
    },
    {
      type: 'scatter',
      x: [Math.min(...xValues), Math.max(...xValues)],
      y: [additionalLine1, additionalLine1],
      mode: 'lines',
      name: 'Additional Line 1',
      showlegend: true,
      line: { color: 'green', width: 2, dash: 'dot' }
    },
    {
      type: 'scatter',
      x: [Math.min(...xValues), Math.max(...xValues)],
      y: [additionalLine2, additionalLine2],
      mode: 'lines',
      name: 'Additional Line 2',
      showlegend: true,
      line: { color: 'green', width: 2, dash: 'dot' }
    }
  ];

  const plotlyLayout: Partial<Layout> = {
    title: 'Control Chart',
    xaxis: { title: 'Sample' },
    yaxis: { title: actualColumnName },
    hovermode: 'closest',
    dragmode: 'select'
  };

  const handlePlotSelect = (eventData: any) => {
    if (eventData && eventData.points) {
      const newExcludedPoints = eventData.points.map((point: any) => point.pointIndex);
      setExcludedPoints(prevExcluded => [...prevExcluded, ...newExcludedPoints]);
    }
  };

  return (
    <>
      {/* Control Chart Settings */}
      <Row className="mb-3">
        <Col md={3}>
          <Form.Group>
            <Form.Label>Additional Line 1</Form.Label>
            <Form.Control type="number" value={additionalLine1} onChange={handleAdditionalLine1Change} step="0.01" />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label>Additional Line 2</Form.Label>
            <Form.Control type="number" value={additionalLine2} onChange={handleAdditionalLine2Change} step="0.01" />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label>Exclude First N Values</Form.Label>
            <Form.Control type="number" value={excludeFirst} onChange={handleExcludeFirstChange} min="0" />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label>Exclude Last N Values</Form.Label>
            <Form.Control type="number" value={excludeLast} onChange={handleExcludeLastChange} min="0" />
          </Form.Group>
        </Col>
      </Row>

      {/* Control Chart */}
      <Row>
        <Col>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Control Chart</Card.Title>
              {isClient && (
                <Suspense fallback={<div>Loading chart...</div>}>
                  <Plot
                    data={plotlyData}
                    layout={plotlyLayout}
                    style={{ width: "100%", height: "400px" }}
                    onSelected={handlePlotSelect}
                  />
                </Suspense>
              )}
              <p>Select points on the chart to exclude them from the analysis.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row>
        <Col md={2}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Minimum</Card.Title>
              <Card.Text>{statistics.min.toFixed(4)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Maximum</Card.Title>
              <Card.Text>{statistics.max.toFixed(4)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Mean</Card.Title>
              <Card.Text>{statistics.mean.toFixed(4)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>LCL</Card.Title>
              <Card.Text>{statistics.lcl.toFixed(4)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>UCL</Card.Title>
              <Card.Text>{statistics.ucl.toFixed(4)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Sigma</Card.Title>
              <Card.Text>{statistics.stdDev.toFixed(6)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Distribution Curve */}
      <Row>
        <Col>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Standard Distribution Curve</Card.Title>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={generateNormalDistribution(statistics.mean, statistics.stdDev, 200, statistics.min, statistics.max)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
  dataKey="x" 
  domain={[statistics.min, statistics.max]} 
  type="number"
  tickFormatter={(value) => value.toFixed(2)}
/>
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="y" stroke="#8884d8" fill="#8884d8" />
                  <ReferenceLine x={statistics.lcl} stroke="red" label="LCL" />
                  <ReferenceLine x={statistics.ucl} stroke="red" label="UCL" />
                  <ReferenceLine x={1.75} stroke="black" label="1.75" />
                </AreaChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Data Table */}
      <Row>
        <Col>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Data Table</Card.Title>
              <Form.Group className="mb-3">
                <Form.Label>Lower Threshold</Form.Label>
                <Form.Control type="number" value={lowerThreshold} onChange={handleLowerThresholdChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Upper Threshold</Form.Label>
                <Form.Control type="number" value={upperThreshold} onChange={handleUpperThresholdChange} />
              </Form.Group>
              <Form.Check 
                type="checkbox"
                label="Exclude values within threshold"
                checked={excludeWithinThreshold}
                onChange={handleExcludeWithinThresholdChange}
                className="mb-3"
              />
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>{actualColumnName}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item: any, index: number) => (
                    <tr key={index}>
                      <td>{item.MCGS_TIME}</td>
                      <td>{item[actualColumnName]}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Pagination>{getPageItems()}</Pagination>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}

function calculateStatistics(data: number[]) {
    const sortedData = [...data].sort((a, b) => a - b);
    const min = Math.min(...data);
    const max = Math.max(...data);
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const median = data.length % 2 === 0
      ? (sortedData[data.length / 2 - 1] + sortedData[data.length / 2]) / 2
      : sortedData[Math.floor(data.length / 2)];
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    const lcl = mean - 3 * stdDev;
    const ucl = mean + 3 * stdDev;
  
    return { min, max, mean, median, stdDev, lcl, ucl };
  }
  
  function generateNormalDistribution(mean: number, stdDev: number, points: number, min: number, max: number) {
    const distribution = [];
    const range = max - min;
    const step = range / (points - 1);
  
    for (let i = 0; i < points; i++) {
      const x = min + i * step;
      const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
      distribution.push({ x, y });
    }
  
    return distribution;
  }