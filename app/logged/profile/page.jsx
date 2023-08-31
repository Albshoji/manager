'use client';
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import React, { useEffect, useRef, useState, useContext } from "react";
import { UserContext } from '../../../contexts/userContext';
import { SendImageFirestore, UpdatePhotoUrl, UpdateEmail, UpdateName, UpdatePassword } from '../../../services/user';

import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import LoadingButton from '@mui/lab/LoadingButton';

import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { set } from 'firebase/database';

export default function Profile() {
    const { user, setPhotoUrl, setName: setname, setEmail : setemail} = useContext(UserContext);

    const [error, setError] = React.useState(false);
    const [success, setSuccess] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [showNewPassword, setShowNewPassword] = React.useState(false);

    const [imageUrl, setImageUrl] = useState(''); 
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [email, setEmail] = useState('');


    

    const fileInputRef = useRef(null);

    useEffect(() => {
        if(user){
            setName(user.name);
            setEmail(user.email);
            setImageUrl(user.photoUrl || '/icon.svg');
        }
        console.log(user);
    }, [user]);

    function onImageChanged(event){
        const image = event.target?.files[0];
        if(image){
           
            SendImageFirestore(`manager/${user.id}/profile`, image, (code, message, url='')=>{
                if(code == 200 ){
                    UpdatePhotoUrl(user.id, url, (code, message)=>{
                        if(code == 200 ){
                            setImageUrl(url);
                            setPhotoUrl(url);
                            setSuccess({code, message: "Foto de perfil atualizada com sucesso!"});
                        }else {
                            setError({code, message});
                        }
                    });
                }else {
                    setError({code, message});
                }
            })
        }
    }
    function onFormSubmit(event){
        event.preventDefault();
        setLoading(true);
        if(password != "" && password == newPassword){
            UpdatePassword(password, (code, message)=>{
                if(code == 200 ){
                    setSuccess({code, message: "Senha atualizada com sucesso!"});
                }else {
                    setError({code, message});
                }
                setLoading(false);
            });
        }
        if(name != user.name && name != ""){
            UpdateName(user.id, name, (code, message)=>{
                if(code == 200 ){
                    setname(name);
                    setSuccess({code, message: "Nome atualizado com sucesso!"});
                }else {
                    setError({code, message});
                }
                setLoading(false);
            });
        }
        if(email != user.email && email != ""){
            UpdateEmail(user.id, email, (code, message)=>{
                if(code == 200 ){
                    setemail(email);
                    setSuccess({code, message: "Email atualizado com sucesso!"});
                }else {
                    setError({code, message});
                }
                setLoading(false);
            });
        }
        setLoading(false);
    }

    return (
        <>
            <Box sx={{justifyContent:'center', display:'flex'}}>
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={onImageChanged}
                    style={{ display: 'none' }} // Oculta o input padrão
                />
                <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                        <IconButton 
                            onClick={()=>fileInputRef.current.click()} 
                            sx={{
                                padding: '5px', 
                                backgroundColor: 'secondary.main', 
                                color: 'white', 
                                border: '1px solid white',
                                '&:hover': {
                                    backgroundColor: 'secondary.light',
                                }
                            }}
                        >
                            <EditIcon />
                        </IconButton>
                    }
                >
                    <Avatar  
                        src={imageUrl}
                        alt="Imagem de Perfil" 
                        sx={{margin: 'auto', width: '130px', height: '130px', backgroundColor:'secondary.dark', padding:'5px'}}
                    />
                </Badge>
            </Box>

            <form style={{marginTop:'40px'}} onSubmit={onFormSubmit}>

                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 1, sm: 2, md: 2}}>
                    <Grid item xs={1}>
                        <TextField
                            label="Nome"
                            placeholder='exemplo@exemplo.com'
                            disabled={loading}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            type='text'
                            sx={{
                                color: 'primary.main',
                                width: '100%',
                                marginBottom: '25px',
                            }}
                            InputProps={{
                                endAdornment: (
                                <InputAdornment position="start">
                                    <PersonIcon color='secondary'/>
                                </InputAdornment>
                                ),
                            }}
                            variant="standard"
                        />
                    </Grid>

                    <Grid item xs={1}>
                        <TextField
                            label="Email"
                            placeholder='exemplo@exemplo.com'
                            disabled={loading}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type='text'
                            sx={{
                                color: 'primary.main',
                                width: '100%',
                                marginBottom: '25px',
                            }}
                            InputProps={{
                                endAdornment: (
                                <InputAdornment position="start">
                                    <EmailOutlinedIcon color='secondary'/>
                                </InputAdornment>
                                ),
                            }}
                            variant="standard"
                        />
                    </Grid>

                    <Grid item xs={1}>
                        <TextField
                        label="Nova Senha"
                        placeholder='**********'
                        disabled={loading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type={showPassword ? 'text' : 'password'}
                        sx={{
                            color: 'primary.main',
                            width: '100%',
                        }}
                        InputProps={{
                            endAdornment: (
                            <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle password visibility"
                                sx={{marginRight: '0px'}}
                                onClick={() => setShowPassword(last => !last)}
                                onMouseDown={(event) => event.preventDefault()}
                                edge="end"
                            >
                                {showPassword ? <VisibilityOff color='secondary' /> : <Visibility color='secondary'/>}
                            </IconButton>
                            </InputAdornment>
                            ),
                        }}
                        variant="standard"
                        />  
                    </Grid>

                    <Grid item xs={1}>
                        <TextField
                        label="Repita a Nova Senha"
                        placeholder='**********'
                        disabled={loading}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        type={showNewPassword ? 'text' : 'password'}
                        sx={{
                            color: 'primary.main',
                            width: '100%',
                        }}
                        InputProps={{
                            endAdornment: (
                            <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle password visibility"
                                sx={{marginRight: '0px'}}
                                onClick={() => setShowNewPassword(last => !last)}
                                onMouseDown={(event) => event.preventDefault()}
                                edge="end"
                            >
                                {showNewPassword ? <VisibilityOff color='secondary' /> : <Visibility color='secondary'/>}
                            </IconButton>
                            </InputAdornment>
                            ),
                        }}
                        variant="standard"
                        />  
                    </Grid>
                </Grid>
                <LoadingButton
                    size="large"
                    type='submit'
                    loading={loading}
                    variant="text"
                    sx={{
                        margin: 'auto',
                        display: 'flex',
                        marginTop: '35px',
                        width: {sm: '70%', xs: '90%'},
                    }}
                    >
                    <span>Salvar</span>
                </LoadingButton>
            </form>



            <Snackbar open={!!error} autoHideDuration={6000} onClose={()=>setError(false)}>
                <Alert onClose={()=>setError(false)} severity="error" sx={{ width: '100%' }}>
                    Code: {error.code} - {error.message}
                </Alert>
            </Snackbar>

            <Snackbar open={!!success} autoHideDuration={6000} onClose={()=>setSuccess(false)}>
                <Alert onClose={()=>setSuccess(false)} severity="success" sx={{ width: '100%' }}>
                    {success.code} - {success.message}
                </Alert>
            </Snackbar>
        </>
    )
}

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});