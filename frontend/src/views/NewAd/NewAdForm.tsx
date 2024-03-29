import { Button, Card, CardActions, CardContent, Fab, Grid, IconButton, Modal, Paper, Tooltip } from '@material-ui/core';
import { createStyles, makeStyles, Theme, withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import React, { useState } from 'react';
import Address from '../../components/Address';
import AddPhotoAlternateIcon from "@material-ui/icons/AddPhotoAlternate";
import AdController from '../../controllers/AdController';
import CurrencyTextField from '@unicef/material-ui-currency-textfield';
import Categories from '../../components/Categories';
import getFormData from '../../utils/getFormData';
import ProductState from '../../components/ProductState';
import { AdvertisingState } from '../../controllers/AdController';
import { useHistory } from 'react-router';
import Swal from 'sweetalert2';
import StyledButton from '../../components/StyledButton';
import DescriptionIcon from '@material-ui/icons/Description';
import dps from 'dbpedia-sparql-client';


const StyledTextField = props => <TextField fullWidth variant="outlined" {...props} />

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    text: {
      textAlign: "center",
    },

    formContainer: {
      display: "flex",
      flexDirection: "column",
      width: "40%",
      alignItems: "center",
      margin: "2%"
    },

    modal: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    root: {
      height: '70%',
      maxHeight: 'initial',
      width: '60%',
      padding: 25,
      overflow: 'auto',

      display: 'flex',
      alignItems: 'center',
      flexDirection: 'column'
    },
    title: {
      fontSize: 14,
    },
    pos: {
      marginBottom: 12,
    },

    cardContainer: {
      width: '100%',
      minHeight: 'min-content',
      
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'column'
    },
    
    card: {
      padding: 15,
      width: '90%',
      // minHeight: 230,

      '& + .MuiCard-root': {
        marginTop: 25,
      }
    }
  }),
);

const StyledAddPhotoAlternateIcon = withStyles({
  root: {
    color: '#c4c4c4'
  }
})((props: any) => <AddPhotoAlternateIcon {...props} />);

const StyledFab = withStyles({
  root: {
    backgroundColor: 'transparent',
    '&:hover *': {
      color: '#a4a4a4',
      backgroundColor: 'transparent',
    },
    '&:hover': {
      backgroundColor: 'transparent',
    },
    boxShadow: 'none',
    border: '1px solid #c4c4c4'
  }
})((props: any) => <Fab {...props} />);

export default function NewAdForm() {
  const history = useHistory();
  const classes = useStyles();

  const [description, setDescription] = useState('');
  const [address, setAddress] = useState({});
  const [category, setCategory] = useState('');
  const [productState, setProductState] = useState('');
  const [numberSelectedImages, setNumberSelectedImages] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [descriptionSuggestions, setDescriptionSuggestions] = useState([{ label: { 'xml:lang': '', value: ''} }]);

  const getQuery = (param) => {
    return `
      SELECT DISTINCT ?s ?label 
      WHERE {
        ?s rdfs:comment ?label . 
        FILTER (lang(?label) IN ('en', 'pt')). 
        ?label bif:contains "${param}" .
      } ORDER BY DESC (lang(?label))  LIMIT 5
      `;
  }

  const getDescriptionSuggestions = title => {
    dps
      .client() 
      .query(getQuery(title))
      .timeout(15000)
      .asJson()
      .then(res => { setDescriptionSuggestions(res.results.bindings); })
      .catch(e => { /* handle error */ });
  }

  function handleDescription(event) {
    const title = (document.querySelector('#title') as HTMLInputElement)?.value
    
    if (title) {
      getDescriptionSuggestions(/\w{3,}/.exec(title)?.[0] || '');
      setOpenModal(true);
    } else {
      Swal.fire({
        icon: 'warning',
        confirmButtonColor: '#80cc54',
        title: `Não foi possível gerar uma descrição!`,
        text: 'Preencha o título do anúncio primeiro'
      })
    }
  }

  function handleValidateImages(event) {
    const files = event.target.files;

    if (files.length > 5) {
      event.target.value = "";
      setNumberSelectedImages(0);
      Swal.fire({
        icon: 'warning',
        confirmButtonColor: '#80cc54',
        title: `Limite máximo de 5 imagens excedido.`,
        text: 'Envie novamente as imagens'
      })
      return;
    }

    if (files && files[0]) {
      const maxAllowedSize = 5 * 1024 * 1024;
      
      [...files].forEach(async (f, index) => {
        if (f.size > maxAllowedSize) {
          // files.splice(index, 1);
          Swal.fire({
            icon: 'warning',
            confirmButtonColor: '#80cc54',
            title: `Tamanho da imagem "${f.name}" excedeu 5 MB.`,
            text: 'Envie novamente as imagens'
          })
          event.target.value = "";
          setNumberSelectedImages(0);
          return;
        }
      })
    }

    setNumberSelectedImages(files.length);
  }

  async function handleUploadImages(adId) {
    const input: any = document.querySelector('#images');

    Array.from(input.files).forEach(async (f, index) => {
      await AdController.images(adId, f);
    });
  }

  const handleSubmit = async event => {
    event.preventDefault();

    const formData = getFormData(event);

    const newAd = {
      ...formData,
      address,
      category,
      description,
      product_state: productState,
      state: AdvertisingState.VISIBLE,
      token: localStorage.getItem('token')
    };

    const price = newAd.price
      .replaceAll('.', '')
      .replaceAll(',', '.');

    newAd.price = parseFloat(price);

    newAd.quantity = parseInt(newAd.quantity, 10);

    delete newAd.images;

    await AdController.postAd(newAd)
      .then(async (response) => {
        if (response) {
          await handleUploadImages(response.id)
          Swal.fire({
            text: "Anúncio publicado!",
            icon: "success",
            confirmButtonColor: "#a6dc86",
            confirmButtonText: "Ok",
            allowOutsideClick: false
          })
            .then(() => {
              history.push('/userpanel/myads');
            })
        } else {
          Swal.fire({
            title: "Algum erro aconteceu...",
            text: "Tente novamente mais tarde",
            icon: "warning",
            confirmButtonColor: "#ed4a4a"
          })
        }
      });
  }

  const CardDescriptionSuggest = ({text}) => {
    function handleClick() {
      setDescription(text);
      setOpenModal(false);
    }

    return (
    <Card className={classes.card} variant="outlined">
      <CardContent>
        {text}
      </CardContent>
      <CardActions>
        <Button color="primary" size="small" onClick={handleClick}>Escolher</Button>
      </CardActions>
    </Card>
    )
  }
  ;

  return (
    <Grid container direction="column" alignItems="center" style={{ height: '100%', justifyContent: 'center' }}>
      <h1 className={classes.text}>Publique agora um novo anúncio!</h1>

      <form className={classes.formContainer} autoComplete="off" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={1}>

          <Grid item xs={12}>
            <StyledTextField required id="title" label="Nome" />
          </Grid>

          <Grid item xs={12}>
            <CurrencyTextField
              required
              fullWidth
              id="price"
              label="Preço"
              textAlign="left"
              variant="outlined"
              currencySymbol="R$"
              decimalCharacter=","
              digitGroupSeparator="."
            />
          </Grid>

          <Grid item xs={12}>
            <StyledTextField
              required
              id="quantity"
              type="number"
              label="Quantidade Disponível"
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Grid>

          <Grid item xs={12}>
            <Categories onChange={selectedCategory => setCategory(selectedCategory)} />
          </Grid>

          <Grid item xs={12}>
            <ProductState onChange={selectedProductState => setProductState(selectedProductState)} />
          </Grid>

          <Grid item xs={12}>
            <Address 
              required
              onChange={newAddress => setAddress(newAddress)} 
            />
          </Grid>

          <Grid item xs={12}>
            <StyledTextField
              required
              // multiline
              id="description"
              label="Descrição"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </Grid>

          <Grid container justify="space-between">
            <Grid item>
              <input
                required
                multiple
                type="file"
                id="images"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleValidateImages}
              />
              <label htmlFor="images">
                <StyledFab component="span" >
                  <StyledAddPhotoAlternateIcon />
                </StyledFab>
              </label>
              &nbsp;&nbsp;{numberSelectedImages} imagens selecionadas
            </Grid>

            <Grid item>
              <Tooltip title="Gerar sugestões de descrição" style={{ float: 'right'}}>
                <IconButton aria-label="description" onClick={handleDescription}>
                  <DescriptionIcon />
                </IconButton>
              </Tooltip>
                
              <Modal
                className={classes.modal}
                open={openModal}
                onClose={() => setOpenModal(false)}
              >
                <Paper className={classes.root}>
                  <h2 style={{ marginBottom: '2vh' }}>Sugestões de Descrição</h2>
                  
                  <div className={classes.cardContainer}>
                    {
                      descriptionSuggestions.map(({ label }, i) => (
                        <CardDescriptionSuggest key={i} text={label.value}/>
                      ))
                    }
                  </div>
                </Paper>
              </Modal>
            </Grid>
          </Grid>
          

        </Grid>
        <StyledButton type="submit" variant="contained">
          Publicar
        </StyledButton>
      </form>
    </Grid>
  );
}