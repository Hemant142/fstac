import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Heading,
  Text
} from "@chakra-ui/react";
import axios from "axios";

export default function Home() {
  const [recording, setRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const [audioURLs, setAudioURLs] = useState([]);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [recordingName, setRecordingName] = useState("");
  const [timer, setTimer] = useState(0); // Store timer value
  const [showTimer, setShowTimer] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(new Audio());
  const [recognizedTexts, setRecognizedTexts] = useState({});

  const generateRandomString = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const length = 8;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  useEffect(() => {
    let interval;
    if (recording) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
      setShowTimer(true);
    } else {
      clearInterval(interval);
      setTimer(0);
      setShowTimer(false);
    }
    return () => clearInterval(interval);
  }, [recording]);

  const startRecording = async () => {
    setShowTimer(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);

    mediaRecorderRef.current.ondataavailable = (e) => {
      setAudioChunks((prevChunks) => [...prevChunks, e.data]);
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    setShowTimer(false);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const saveRecording = () => {
    if (!recordingName) {
      setRecordingName(generateRandomString());
    } else {
      setIsModalOpen(true);
    }
  };

  const handleSave = () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
    const url = URL.createObjectURL(audioBlob);
    const recordingDate = new Date().toLocaleString();
    
    const audioElement = new Audio(url);
    audioElement.addEventListener('loadedmetadata', () => {
     
      setAudioURLs((prevURLs) => [
        ...prevURLs,
        { url, name: recordingName, date: recordingDate } 
      ]);
    });

    // This will trigger the 'loadedmetadata' event
    audioElement.load();

    setRecordingName("");
    setIsModalOpen(false);
    setAudioChunks([]);
    
    // Send POST request to store the data
    axios.post("http://localhost:8080/audios", {
      url,
      name: recordingName,
      date: recordingDate
    }).then(response => {
      console.log("Recording saved:", response.data);
    }).catch(error => {
      console.error("Error saving recording:", error);
    });
  };

  const toggleAudio = (url) => {
    if (audioPlaying) {
      audioRef.current.pause();
      setRecognizedTexts((prevTexts) => {
        const updatedTexts = { ...prevTexts };
        delete updatedTexts[url];
        return updatedTexts;
      });
    } else {
      audioRef.current.src = url;
      audioRef.current.play();
      transcribeAudio(url);
    }
    setAudioPlaying(!audioPlaying);
  };

  const transcribeAudio = async (url) => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let recognizedText = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        recognizedText += event.results[i][0].transcript;
        setRecognizedTexts((prevTexts) => ({ ...prevTexts, [url]: recognizedText }));
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended.');
    };

    recognition.start();
  };

  const handleDelete = (index) => {
    const updatedAudioURLs = [...audioURLs];
    updatedAudioURLs.splice(index, 1);
    setAudioURLs(updatedAudioURLs);
    
    // Send DELETE request to delete the data
    const audioIdToDelete = audioURLs[index]._id;
     // Assuming each recording has an 'id' property

    axios.delete(`http://localhost:8080/audios/${audioIdToDelete}`)
      .then(response => {
        console.log("Recording deleted:", response.data);
      })
      .catch(error => {
        console.error("Error deleting recording:", error);
      });
  };

  const openRenameModal = (index) => {
    setEditingIndex(index);
    setRecordingName(audioURLs[index].name);
    setRenameModalOpen(true);
  };

  const handleRenameSave = () => {
    const updatedAudioURLs = [...audioURLs];
    updatedAudioURLs[editingIndex].name = recordingName;
    setAudioURLs(updatedAudioURLs);
    setRenameModalOpen(false);
    
    // Send PUT request to update the name
    const audioIdToUpdate = audioURLs[editingIndex]._id;
    axios.put(`http://localhost:8080/audios/${audioIdToUpdate}`, {
      name: recordingName
    }).then(response => {
      console.log("Recording renamed:", response.data);
    }).catch(error => {
      console.error("Error renaming recording:", error);
    });
  };

  // Fetch data on component mount
  useEffect(() => {
    axios.get("http://localhost:8080/audios")
      .then(response => {
        setAudioURLs(response.data);
      })
      .catch(error => {
        console.error("Error fetching recordings:", error);
      });
  }, []);

  return (
    <Box>
      <Card align='center'>
        <CardHeader>
          <Heading size='md'>Welcome to Fstac dashboard</Heading>
        </CardHeader>
        <CardBody>
          <Text>This app has audio recording and playback functionality.</Text>
        </CardBody>
        <CardFooter>
          <Box display="grid">
            <Box>
              {showTimer && (
                <Heading as='h4' size='md' textAlign="center"> Timer: 00:{timer < 10 ? "0" + timer : timer}</Heading>
              )}
            </Box>
            <Box display="flex" justifyContent="center" alignItems="center" marginTop="10px" marginBottom="10px" >
              <Box gap="10px" display="flex">
                <Box>
                  <Button colorScheme='blue' onClick={recording ? stopRecording : startRecording}>
                    {recording ? "Pause Recording" : "Start Recording"}
                  </Button>
                </Box>
                {!recording && audioChunks.length > 0 && (
                  <Box>
                    <Button colorScheme='green' onClick={saveRecording} disabled={!audioChunks.length}>
                      Save Recording
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </CardFooter>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Save Recording</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Recording Name"
              value={recordingName}
              onChange={(e) => setRecordingName(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSave}>
              Save
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={renameModalOpen} onClose={() => setRenameModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Rename Recording</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Recording Name"
              value={recordingName}
              onChange={(e) => setRecordingName(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleRenameSave}>
              Save
            </Button>
            <Button onClick={() => setRenameModalOpen(false)}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {audioURLs.length > 0 && (
        <Table>
          <Thead>
            <Tr>
              <Th maxWidth="200px">S/No</Th>
              <Th maxWidth="200px">Recording Name</Th>
              <Th maxWidth="200px">Date</Th>
              {/* <Th maxWidth="200px">Duration</Th> */}
              <Th maxWidth="200px">Text</Th>
              <Th maxWidth="200px">Action</Th>
              <Th maxWidth="200px">Rename</Th>
              <Th maxWidth="200px">Delete</Th>
            </Tr>
          </Thead>
          <Tbody>
            {audioURLs.map((recording, index) => (
              <Tr key={index}>
                <Td maxWidth="200px">{index + 1}</Td>
                <Td maxWidth="200px">{recording.name}</Td>
                <Td maxWidth="200px">{recording.date}</Td>
                {/* <Td maxWidth="200px">{`00:${recording.duration < 10 ? "0" + recording.duration : recording.duration}`}</Td> */}
                <Td maxWidth="200px">
                  <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                    <p>{recognizedTexts[recording.url]}</p>
                  </div>
                </Td>
                <Td maxWidth="200px">
                  <Button onClick={() => toggleAudio(recording.url)}>
                    {audioPlaying && audioRef.current.src === recording.url ? 'Pause' : 'Play'}
                  </Button>
                </Td>
                <Td maxWidth="200px">
                  <Button onClick={() => openRenameModal(index)}>Rename</Button>
                </Td>
                <Td>
                  <Button colorScheme="red" onClick={() => handleDelete(index)}>Delete</Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
}
