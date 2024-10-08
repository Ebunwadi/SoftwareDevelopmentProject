// code by Albert
import {
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  useColorModeValue,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useShowToast from "../hooks/useShowToast";
import { useRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";

const EditPost = () => {
  const { state } = useLocation(); // Access the post data passed from the previous page
  const [text, setText] = useState(state.post.text);
  const [user] = useRecoilState(userAtom);
  const [img, setImg] = useState(state.post.img); // Store the current image URL
  const navigate = useNavigate();
  const showToast = useShowToast();
  const fileRef = useRef(null);
  const [updating, setUpdating] = useState(false);


      // Handle image file selection
      const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file && file.type.startsWith("image/")) {
			const reader = new FileReader();

			reader.onloadend = () => {
				setImg(reader.result);
			};

			reader.readAsDataURL(file);
		} else {
			showToast("Invalid file type", " Please select an image file", "error");
			setImg(null);
		}
    };

    const handleCancel = () => {
        navigate(`/${user.username}`); // Navigate back to user page on cancel
    };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (updating) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/posts/${state.post._id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, img })
      });

      const data = await res.json();
      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }

      showToast("Success", "Post updated successfully", "success");
      navigate(`/${user.username}`); 

    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
        setUpdating(false);
    }
  };

  return (
    <form onSubmit={handleUpdate}>
      <Flex align={"center"} justify={"center"} my={6}>
        <Stack
          spacing={4}
          w={"full"}
          maxW={"md"}
          bg={useColorModeValue("white", "gray.dark")}
          rounded={"xl"}
          boxShadow={"lg"}
          p={6}
        >
          <Heading lineHeight={1.1} fontSize={{ base: "2xl", sm: "3xl" }}>
            User Post Edit
          </Heading>
          <FormControl>
            <FormLabel>Post Text</FormLabel>
            <Input
              placeholder="Edit your post text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              type="text"
            />
          </FormControl>

          <FormControl>
            <Center>
              <img src={img} alt="Post" width="200" />
            </Center>
            <Center w="full">
              <Button onClick={() => fileRef.current.click()}>
                Change image
              </Button>
              <Input
                type="file"
                hidden
                ref={fileRef}
                onChange={handleImageChange}
              />
            </Center>
          </FormControl>
          <Stack spacing={6} direction={["column", "row"]}>
            <Button
                bg={"red.400"}
                color={"white"}
                w='full'
                _hover={{
                    bg: "red.500",
                }}
                onClick={handleCancel}
            >
                Cancel
            </Button>
            <Button
                bg={"green.400"}
                color={"white"}
                w='full'
                _hover={{
                    bg: "green.500",
                }}
                type='submit'
                isLoading={updating}
            >
                edit
            </Button>
         </Stack>
        </Stack>
      </Flex>
    </form>
  );
};

export default EditPost;
