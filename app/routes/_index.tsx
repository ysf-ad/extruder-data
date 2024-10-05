import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import { useState, useEffect } from "react";
import { storage } from "~/services/firebase.server";
import { Container, Row, Col, Form, Alert, Button } from 'react-bootstrap';
import Dashboard from "../components/dashboard";
import Papa from 'papaparse';

const TARGET_DATA_POINTS = 10000;

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const selectedFile = url.searchParams.get("file") || "";
  const selectedDataType = url.searchParams.get("dataType") || "x";

  try {
    const [files] = await storage.bucket().getFiles();
    const csvFiles = await Promise.all(
      files
        .filter((file) => file.name.endsWith(".csv"))
        .map(async (file) => {
          const [metadata] = await file.getMetadata();
          return {
            name: file.name,
            createdAt: metadata.timeCreated,
          };
        })
    );

    csvFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    let csvData: any[] = [];
    let fullFileContent: string | null = null;
    if (selectedFile) {
      const [fileContents] = await storage.bucket().file(selectedFile).download();
      fullFileContent = fileContents.toString('utf-8');
      const result = Papa.parse(fullFileContent, { header: true });
      const fullData = result.data;
      
      // Sample the data to approximately 10,000 points
      const samplingRate = Math.max(1, Math.floor(fullData.length / TARGET_DATA_POINTS));
      csvData = fullData.filter((_, index) => index % samplingRate === 0);
      
      console.log("Sampled CSV Data:", csvData.slice(0, 5)); // Log first 5 rows
    }
    
    return json({ csvFiles, csvData, selectedFile, selectedDataType, fullFileContent });
  } catch (error) {
    console.error("Error in loader:", error);
    return json({ error: "An error occurred while fetching data" }, { status: 500 });
  }
};

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const [selectedFile, setSelectedFile] = useState(loaderData.selectedFile || "");
  const [selectedDataType, setSelectedDataType] = useState(loaderData.selectedDataType || "xy");
  const [error, setError] = useState(loaderData.error || "");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Loader Data:", loaderData);
    console.log("Selected File:", selectedFile);
    console.log("Selected Data Type:", selectedDataType);
    console.log("CSV Data:", loaderData.csvData?.slice(0, 5));
  }, [loaderData, selectedFile, selectedDataType]);

  const handleFileChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    console.log("File changed:", event.target.value);
    setSelectedFile(event.target.value);
    navigate(`?file=${event.target.value}&dataType=${selectedDataType}`);
  };

  const handleDataTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    console.log("Data type changed:", event.target.value);
    setSelectedDataType(event.target.value);
    navigate(`?file=${selectedFile}&dataType=${event.target.value}`);
  };

  const handleDownload = () => {
    console.log(selectedFile)
    console.log(loaderData.fullFileContent)
    console.log(loaderData)
    if (selectedFile && loaderData.fullFileContent) {
      const blob = new Blob([loaderData.fullFileContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', selectedFile);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handleLogin = () => {
    if (password === "Canada@1231") {
      setIsAuthenticated(true);
    } else {
      setError("Invalid password");
    }
  };

  if (!isAuthenticated) {
    return (
      <Container fluid>
        <Row className="my-3">
          <Col>
            <h1>Login</h1>
            <Form.Group controlId="password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={handlePasswordChange}
              />
            </Form.Group>
            <Button className="mt-3" onClick={handleLogin}>Login</Button>
            {error && (
              <Alert variant="danger" className="mt-3">{error}</Alert>
            )}
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row className="my-3">
        <Col>
          <h1>Extruder Data Dashboard</h1>
          <img src="https://www.digitmakers.ca/cdn/shop/files/Digitmakers-png24_550x.png" width={100}/>
        </Col>
      </Row>
      {error && (
        <Row>
          <Col>
            <Alert variant="danger">{error}</Alert>
          </Col>
        </Row>
      )}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Select CSV File</Form.Label>
            <Form.Select value={selectedFile} onChange={handleFileChange}>
              <option value="">Choose a file</option>
              {loaderData.csvFiles?.map((file: { name: string; createdAt: string }) => (
                <option key={file.name} value={file.name}>
                  {file.name} (uploaded {new Date(file.createdAt).toLocaleDateString()})
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Select Data Type</Form.Label>
            <Form.Select value={selectedDataType} onChange={handleDataTypeChange}>
              <option value="xy">XY</option>
              <option value="x">X</option>
              <option value="y">Y</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      <Row className="mb-3">
        <Col>
          <Button className="btn-dark" onClick={handleDownload}
          // disabled={!selectedFile || !loaderData.fullFileContent}
          >
            Download Selected CSV
          </Button>
        </Col>
      </Row>
      <Row>
        <Col>
          <p>Selected File: {selectedFile}</p>
          <p>Selected Data Type: {selectedDataType}</p>
        </Col>
      </Row>
      {selectedFile && loaderData.csvData && loaderData.csvData.length > 0 ? (
        <Dashboard data={loaderData.csvData} dataType={selectedDataType} />
      ) : (
        <p>No data available. Please select a CSV file.</p>
      )}
    </Container>
  );
}